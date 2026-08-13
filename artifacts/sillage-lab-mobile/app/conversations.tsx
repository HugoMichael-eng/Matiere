import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
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
import { useColors } from '@workspace/s1/hooks/use-colors';
import { nativeTheme } from '@workspace/s1/lib/native-theme';
import {
  useCreateConversation,
  useDeleteConversation,
  useListConversations,
} from '@workspace/api-client-react';
import type { Conversation } from '@workspace/api-client-react';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ConversationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const {
    data: conversations = [],
    isLoading,
    refetch,
    isRefetching,
  } = useListConversations();
  const createMutation = useCreateConversation();
  const deleteMutation = useDeleteConversation();

  const handleCreate = async () => {
    const title = newTitle.trim() || 'Untitled Session';
    try {
      const conv = await createMutation.mutateAsync({ data: { title } });
      setNewTitle('');
      setShowModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/conversation/${conv.id}`);
    } catch {
      Alert.alert('Error', 'Could not create session. Please try again.');
    }
  };

  const handleDelete = (id: number, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Session',
      `Delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ conversationId: id });
              refetch();
            } catch {
              Alert.alert('Error', 'Could not delete session.');
            }
          },
        },
      ],
    );
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 16,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.foreground,
                fontFamily: nativeTheme.fontFamily.sansBold,
              },
            ]}
          >
            Sessions
          </Text>
          <Text
            style={[
              styles.headerSub,
              {
                color: colors.mutedForeground,
                fontFamily: nativeTheme.fontFamily.sans,
              },
            ]}
          >
            {conversations.length}{' '}
            {conversations.length === 1 ? 'session' : 'sessions'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowModal(true)}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.accent,
                borderRadius: nativeTheme.radius,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="plus" size={20} color={colors.accentForeground} />
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert('Sign out', 'Sign out of Sillage Lab?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign out',
                  style: 'destructive',
                  onPress: () => signOut(),
                },
              ])
            }
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.muted,
                borderRadius: nativeTheme.radius,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="log-out" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={conversations as Conversation[]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPad + 16 },
            conversations.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={conversations.length > 0 ? (
            <View style={[styles.moodBanner, { borderRadius: nativeTheme.radius, borderColor: colors.border }]}>
              <Image
                source={require('../assets/images/material-macro.jpg')}
                style={styles.moodBannerImg}
                resizeMode="cover"
              />
              <View style={[styles.moodBannerOverlay, { backgroundColor: colors.background }]} />
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather
                name="message-circle"
                size={40}
                color={colors.mutedForeground}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.foreground,
                    fontFamily: nativeTheme.fontFamily.sansSemiBold,
                  },
                ]}
              >
                No sessions yet
              </Text>
              <Text
                style={[
                  styles.emptyBody,
                  {
                    color: colors.mutedForeground,
                    fontFamily: nativeTheme.fontFamily.sans,
                  },
                ]}
              >
                Start a coaching session to get feedback on your formulas
              </Text>
              <Pressable
                onPress={() => setShowModal(true)}
                style={({ pressed }) => [
                  styles.emptyBtn,
                  {
                    backgroundColor: colors.accent,
                    borderRadius: nativeTheme.radius,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.emptyBtnText,
                    {
                      color: colors.accentForeground,
                      fontFamily: nativeTheme.fontFamily.sansMedium,
                    },
                  ]}
                >
                  New Session
                </Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/conversation/${item.id}`);
              }}
              onLongPress={() => handleDelete(item.id, item.title)}
              style={({ pressed }) => [
                styles.convItem,
                {
                  backgroundColor: pressed ? colors.muted : colors.card,
                  borderColor: colors.border,
                  borderRadius: nativeTheme.radius,
                },
              ]}
            >
              <View style={styles.convLeft}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.convTitle,
                    {
                      color: colors.foreground,
                      fontFamily: nativeTheme.fontFamily.sansMedium,
                    },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.convMeta,
                    {
                      color: colors.mutedForeground,
                      fontFamily: nativeTheme.fontFamily.sans,
                    },
                  ]}
                >
                  {item.messageCount}{' '}
                  {item.messageCount === 1 ? 'message' : 'messages'}
                </Text>
              </View>
              <View style={styles.convRight}>
                <Text
                  style={[
                    styles.convDate,
                    {
                      color: colors.mutedForeground,
                      fontFamily: nativeTheme.fontFamily.sans,
                    },
                  ]}
                >
                  {formatDate(item.updatedAt)}
                </Text>
                <Feather
                  name="chevron-right"
                  size={16}
                  color={colors.mutedForeground}
                />
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      {/* New session modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setShowModal(false)}
        >
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
                {
                  color: colors.foreground,
                  fontFamily: nativeTheme.fontFamily.sansSemiBold,
                },
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
              placeholder="What are you working on?"
              placeholderTextColor={colors.mutedForeground}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setShowModal(false);
                  setNewTitle('');
                }}
                style={({ pressed }) => [
                  styles.modalBtn,
                  {
                    backgroundColor: colors.muted,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalBtnText,
                    {
                      color: colors.mutedForeground,
                      fontFamily: nativeTheme.fontFamily.sansMedium,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
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
                  <ActivityIndicator
                    size="small"
                    color={colors.accentForeground}
                  />
                ) : (
                  <Text
                    style={[
                      styles.modalBtnText,
                      {
                        color: colors.accentForeground,
                        fontFamily: nativeTheme.fontFamily.sansMedium,
                      },
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26 },
  headerSub: { fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },
  listEmpty: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, marginTop: 10 },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyBtnText: { fontSize: 14 },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
  },
  convLeft: { flex: 1, gap: 4 },
  convTitle: { fontSize: 15 },
  convMeta: { fontSize: 12 },
  convRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  convDate: { fontSize: 12 },
  moodBanner: {
    height: 130,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  moodBannerImg: { width: '100%', height: '100%' },
  moodBannerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.35,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 320,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  modalTitle: { fontSize: 17 },
  modalInput: {
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    minHeight: 44,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: { fontSize: 14 },
});
