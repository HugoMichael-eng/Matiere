import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@workspace/s1/hooks/use-colors';
import { nativeTheme } from '@workspace/s1/lib/native-theme';
import {
  useCreateConversation,
  useDeleteConversation,
  useListConversations,
  useListMaterials,
} from '@workspace/api-client-react';
import type { Conversation, Material } from '@workspace/api-client-react';
import {
  BASE_ACCORDS,
  BASE_MOODS,
  PINNED_SESSIONS_KEY,
  accordSeedMessage,
  moodSeedMessage,
} from '@/constants/creative-lab';
import { removePinnedSession } from '@/lib/pinned-sessions';

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function CreativeLabScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [search, setSearch] = useState('');
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
  const [creatingFrom, setCreatingFrom] = useState<string | null>(null);

  // Load pinned sessions from persistent storage
  useEffect(() => {
    AsyncStorage.getItem(PINNED_SESSIONS_KEY)
      .then((raw) => {
        if (raw) setPinnedIds(new Set(JSON.parse(raw) as number[]));
      })
      .catch(() => {});
  }, []);

  const togglePin = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPinnedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      AsyncStorage.setItem(PINNED_SESSIONS_KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  };

  const {
    data: conversations = [],
    isLoading,
    refetch,
    isRefetching,
  } = useListConversations();
  const materialsQuery = useListMaterials();
  const createMutation = useCreateConversation();
  const deleteMutation = useDeleteConversation();

  // ── Personalized moods & accords from the user's material library (same logic as web) ──
  const { moods, accords } = useMemo(() => {
    const libraryMaterials = (materialsQuery.data ?? []) as Material[];
    const byFamily = new Map<string, Material[]>();
    for (const m of libraryMaterials) {
      const key = m.family?.toLowerCase().trim() ?? '';
      if (!key) continue;
      const list = byFamily.get(key) ?? [];
      list.push(m);
      byFamily.set(key, list);
    }
    const has = (fams: readonly string[]) => fams.some((f) => (byFamily.get(f)?.length ?? 0) > 0);
    const owned = (fams: readonly string[]) =>
      fams.flatMap((f) => byFamily.get(f) ?? []).map((m) => m.name);

    const moodList = BASE_MOODS.map((mood) => {
      const names = owned(mood.families);
      const prompt =
        names.length > 0
          ? `${mood.prompt}. From my own material library I have: ${names.slice(0, 6).join(', ')} — build the direction around what I already own.`
          : mood.prompt;
      return { ...mood, prompt, ownedCount: names.length };
    });

    const accordList = BASE_ACCORDS.map((accord) => {
      const names = owned(accord.families);
      const buildable = accord.families.length > 0 && accord.families.every((f) => has([f]));
      const familyLabel = accord.families[0] ?? '';
      const hint =
        names.length > 0
          ? names.length === 1
            ? `You have ${names[0]} — a starting point.`
            : `You have ${names.length} ${familyLabel} materials to build with.`
          : null;
      return { ...accord, ownedNames: names, buildable, hint };
    });

    accordList.sort((a, b) => Number(b.buildable) - Number(a.buildable));
    return { moods: moodList, accords: accordList };
  }, [materialsQuery.data]);

  // Create a session, then navigate to chat — optionally with a seed message
  const createWithTitle = async (title: string, autoMessage?: string) => {
    if (creatingFrom) return;
    setCreatingFrom(title);
    try {
      const conv = await createMutation.mutateAsync({ data: { title } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewTitle('');
      setShowModal(false);
      router.push({
        pathname: '/conversation/[id]',
        params: autoMessage
          ? { id: String(conv.id), seed: autoMessage }
          : { id: String(conv.id) },
      });
    } catch {
      Alert.alert('Error', 'Could not create session. Please try again.');
    } finally {
      setCreatingFrom(null);
    }
  };

  const handleDelete = (id: number, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Session', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ conversationId: id });
            await removePinnedSession(id);
            setPinnedIds((prev) => {
              if (!prev.has(id)) return prev;
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            refetch();
          } catch {
            Alert.alert('Error', 'Could not delete session.');
          }
        },
      },
    ]);
  };

  const filtered = (conversations as Conversation[]).filter(
    (c) => !search.trim() || c.title.toLowerCase().includes(search.toLowerCase()),
  );
  const ordered = [
    ...filtered.filter((c) => pinnedIds.has(c.id)),
    ...filtered.filter((c) => !pinnedIds.has(c.id)),
  ].slice(0, 8);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);
  const mono = nativeTheme.fontFamily.sansMedium;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad + 32 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.eyebrow,
                { color: colors.mutedForeground, fontFamily: mono },
              ]}
            >
              CREATIVE LAB
            </Text>
            <Text
              style={[
                styles.headerTitle,
                { color: colors.foreground, fontFamily: nativeTheme.fontFamily.sansBold },
              ]}
            >
              What are you{'\n'}working on?
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShowModal(true)}
              style={({ pressed }) => [
                styles.newBtn,
                { backgroundColor: colors.foreground, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.newBtnText,
                  { color: colors.background, fontFamily: nativeTheme.fontFamily.sansMedium },
                ]}
              >
                + New
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert('Sign out', 'Sign out of Sillage Lab?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
                ])
              }
              style={({ pressed }) => [styles.signOutBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Feather name="log-out" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {/* ── Search ── */}
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[
              styles.searchInput,
              { color: colors.foreground, fontFamily: nativeTheme.fontFamily.sans },
            ]}
            placeholder="Search sessions…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* ── Explore by mood ── */}
        <Text
          style={[styles.sectionLabel, { color: colors.foreground, fontFamily: mono }]}
        >
          EXPLORE BY MOOD
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodRow}
        >
          {moods.map((mood) => (
            <Pressable
              key={mood.name}
              disabled={!!creatingFrom}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                createWithTitle(mood.name, moodSeedMessage(mood));
              }}
              style={({ pressed }) => [
                styles.moodItem,
                { opacity: pressed || (creatingFrom && creatingFrom !== mood.name) ? 0.6 : 1 },
              ]}
            >
              <View style={[styles.moodCircle, { borderColor: colors.border }]}>
                <Image source={mood.img} style={styles.moodImg} />
                {creatingFrom === mood.name && (
                  <View style={styles.moodLoading}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.moodLabel,
                  { color: colors.mutedForeground, fontFamily: nativeTheme.fontFamily.sans },
                ]}
              >
                {mood.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Popular accords ── */}
        <Text
          style={[styles.sectionLabel, { color: colors.foreground, fontFamily: mono }]}
        >
          POPULAR ACCORDS
        </Text>
        <View style={styles.accordList}>
          {accords.map((accord) => (
            <Pressable
              key={accord.name}
              disabled={!!creatingFrom}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                createWithTitle(accord.name, accordSeedMessage(accord, accord.ownedNames));
              }}
              style={({ pressed }) => [
                styles.accordRow,
                {
                  backgroundColor: pressed ? colors.muted : colors.card,
                  borderColor: colors.border,
                  opacity: creatingFrom && creatingFrom !== accord.name ? 0.6 : 1,
                },
              ]}
            >
              <View style={[styles.accordIcon, { backgroundColor: colors.background }]}>
                {creatingFrom === accord.name ? (
                  <ActivityIndicator size="small" color={colors.mutedForeground} />
                ) : (
                  <Feather name={accord.icon} size={14} color={colors.mutedForeground} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.accordTitleRow}>
                  <Text
                    style={[
                      styles.accordName,
                      { color: colors.foreground, fontFamily: nativeTheme.fontFamily.sansMedium },
                    ]}
                  >
                    {accord.name}
                  </Text>
                  {accord.buildable && (
                    <View
                      style={[
                        styles.buildableBadge,
                        { borderColor: colors.accent, backgroundColor: colors.muted },
                      ]}
                    >
                      <Text
                        style={[
                          styles.buildableText,
                          { color: colors.foreground, fontFamily: mono },
                        ]}
                      >
                        YOU HAVE THE MATERIALS
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.accordDesc,
                    { color: colors.mutedForeground, fontFamily: nativeTheme.fontFamily.sans },
                  ]}
                >
                  {accord.hint ?? accord.desc}
                </Text>
              </View>
              <Feather name="arrow-right" size={14} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        {/* ── Recent inspiration ── */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : ordered.length > 0 ? (
          <>
            <Text
              style={[styles.sectionLabel, { color: colors.foreground, fontFamily: mono }]}
            >
              RECENT INSPIRATION
            </Text>
            <View style={[styles.sessionList, { borderTopColor: colors.border }]}>
              {ordered.map((conv) => {
                const isPinned = pinnedIds.has(conv.id);
                return (
                  <View
                    key={conv.id}
                    style={[
                      styles.sessionRow,
                      {
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/conversation/${conv.id}`);
                      }}
                      onLongPress={() => handleDelete(conv.id, conv.title)}
                      style={({ pressed }) => [
                        styles.sessionMain,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Open session ${conv.title}`}
                      testID={`button-session-${conv.id}`}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={styles.sessionTitleRow}>
                          {isPinned && (
                            <Text
                              style={[
                                styles.pinnedLabel,
                                { color: colors.mutedForeground, fontFamily: mono },
                              ]}
                            >
                              PINNED
                            </Text>
                          )}
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.sessionTitle,
                              { color: colors.foreground, fontFamily: nativeTheme.fontFamily.sansMedium },
                            ]}
                          >
                            {conv.title}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.sessionMeta,
                            { color: colors.mutedForeground, fontFamily: mono },
                          ]}
                        >
                          {conv.messageCount ?? 0} {(conv.messageCount ?? 0) === 1 ? 'msg' : 'msgs'} ·{' '}
                          {relativeDate(conv.updatedAt)}
                        </Text>
                      </View>
                      <Feather name="arrow-right" size={14} color={colors.mutedForeground} />
                    </Pressable>
                    <View style={styles.sessionActions}>
                      <Pressable
                        onPress={() => togglePin(conv.id)}
                        hitSlop={8}
                        style={styles.pinBtn}
                        accessibilityRole="button"
                        accessibilityLabel={isPinned ? `Unpin session ${conv.title}` : `Pin session ${conv.title}`}
                        testID={`button-pin-session-${conv.id}`}
                      >
                        <Feather
                          name="bookmark"
                          size={15}
                          color={isPinned ? colors.foreground : colors.mutedForeground}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(conv.id, conv.title)}
                        hitSlop={8}
                        style={styles.deleteBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete session ${conv.title}`}
                        testID={`button-delete-session-${conv.id}`}
                      >
                        <Feather name="trash-2" size={16} color={colors.destructive} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : conversations.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Text
              style={[
                styles.emptyTitle,
                { color: colors.foreground, fontFamily: nativeTheme.fontFamily.sansSemiBold },
              ]}
            >
              No threads yet.
            </Text>
            <Text
              style={[
                styles.emptyBody,
                { color: colors.mutedForeground, fontFamily: nativeTheme.fontFamily.sans },
              ]}
            >
              Tap a mood, an accord, or «+ New» to start your first session.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ── New session modal ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: nativeTheme.radius,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: colors.foreground, fontFamily: nativeTheme.fontFamily.sansSemiBold },
              ]}
            >
              New Session
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  fontFamily: nativeTheme.fontFamily.sans,
                },
              ]}
              placeholder="Name this thread…"
              placeholderTextColor={colors.mutedForeground}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => createWithTitle(newTitle.trim() || 'New session')}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setShowModal(false);
                  setNewTitle('');
                }}
                style={({ pressed }) => [
                  styles.modalBtn,
                  { backgroundColor: colors.muted, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.modalBtnText,
                    { color: colors.mutedForeground, fontFamily: nativeTheme.fontFamily.sansMedium },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={() => createWithTitle(newTitle.trim() || 'New session')}
                disabled={createMutation.isPending}
                style={({ pressed }) => [
                  styles.modalBtn,
                  {
                    flex: 1.5,
                    backgroundColor: colors.accent,
                    opacity: pressed || createMutation.isPending ? 0.7 : 1,
                  },
                ]}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.accentForeground} />
                ) : (
                  <Text
                    style={[
                      styles.modalBtnText,
                      { color: colors.accentForeground, fontFamily: nativeTheme.fontFamily.sansMedium },
                    ]}
                  >
                    Start Session
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    gap: 12,
  },
  eyebrow: { fontSize: 9, letterSpacing: 3 },
  headerTitle: { fontSize: 32, lineHeight: 36, marginTop: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  newBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  newBtnText: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  signOutBtn: { padding: 6 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    minHeight: 44,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 10 },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 2.5,
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 14,
  },
  moodRow: { paddingHorizontal: 20, gap: 18 },
  moodItem: { alignItems: 'center', gap: 8 },
  moodCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    overflow: 'hidden',
  },
  moodImg: { width: '100%', height: '100%' },
  moodLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: { fontSize: 11 },
  accordList: { paddingHorizontal: 20, gap: 8 },
  accordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  accordIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  accordName: { fontSize: 13 },
  buildableBadge: {
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  buildableText: { fontSize: 7, letterSpacing: 1 },
  accordDesc: { fontSize: 12, marginTop: 2 },
  sessionList: { marginHorizontal: 20, borderTopWidth: 1 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
  },
  sessionMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 2,
  },
  sessionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pinnedLabel: { fontSize: 7, letterSpacing: 1.5 },
  sessionTitle: { fontSize: 15, flexShrink: 1 },
  sessionMeta: { fontSize: 10, marginTop: 5 },
  pinBtn: { padding: 8 },
  deleteBtn: { padding: 8 },
  center: { paddingVertical: 40, alignItems: 'center' },
  empty: {
    marginHorizontal: 20,
    marginTop: 36,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 18 },
  emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: { width: 320, padding: 20, borderWidth: 1, gap: 16 },
  modalTitle: { fontSize: 17 },
  modalInput: { borderWidth: 1, padding: 12, fontSize: 15, minHeight: 44 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: { fontSize: 14 },
});
