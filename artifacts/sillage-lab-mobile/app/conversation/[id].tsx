import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image as RNImage,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@workspace/s1/hooks/use-colors';
import { nativeTheme } from '@workspace/s1/lib/native-theme';
import { useGetConversation } from '@workspace/api-client-react';
import { streamConversationMessage } from '@/lib/streaming';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
};

function TypingIndicator({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View
      style={[
        styles.bubble,
        styles.assistantBubble,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.typingDots}>
        <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
        <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
        <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
      </View>
    </View>
  );
}

export default function ConversationScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(rawId);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getToken } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [formulaContext, setFormulaContext] = useState('');
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Load existing conversation
  const { data: conversation, isLoading } = useGetConversation(conversationId, {
    query: {
      enabled: !Number.isNaN(conversationId),
    },
  });

  // Populate messages from server data on first load
  React.useEffect(() => {
    if (conversation && !initialized) {
      const loaded: ChatMessage[] = conversation.messages.map((m) => ({
        id: String(m.id),
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
      setMessages(loaded);
      setInitialized(true);
    }
  }, [conversation, initialized]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: 'opt-user-' + Date.now().toString() + Math.random().toString(36).slice(2),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setShowTyping(true);

    const context = formulaContext.trim() || null;
    let streamingId: string | null = null;
    let fullContent = '';

    try {
      const token = await getToken();

      await streamConversationMessage(
        conversationId,
        text,
        context,
        token,
        {
          onToken: (chunk) => {
            fullContent += chunk;
            if (streamingId === null) {
              // First token — replace typing indicator with streaming bubble
              streamingId =
                'streaming-' + Date.now().toString() + Math.random().toString(36).slice(2);
              setShowTyping(false);
              setMessages((prev) => [
                ...prev,
                { id: streamingId!, role: 'assistant', content: fullContent, isStreaming: true },
              ]);
            } else {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.isStreaming) {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: fullContent,
                  };
                }
                return updated;
              });
            }
          },
          onDone: (event) => {
            // Replace streaming bubble with confirmed server message
            setMessages((prev) => {
              const withoutStreaming = prev.filter(
                (m) => !m.isStreaming,
              );
              return [
                ...withoutStreaming,
                {
                  id: String(event.message.id),
                  role: 'assistant',
                  content: event.message.content,
                },
              ];
            });
          },
          onError: (err) => {
            setShowTyping(false);
            setMessages((prev) => [
              ...prev.filter((m) => !m.isStreaming),
              {
                id: 'err-' + Date.now().toString(),
                role: 'assistant',
                content: `⚠️ ${err}`,
              },
            ]);
          },
        },
      );
    } catch {
      setShowTyping(false);
      setMessages((prev) => [
        ...prev.filter((m) => !m.isStreaming),
        {
          id: 'err-' + Date.now().toString(),
          role: 'assistant',
          content: '⚠️ Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
      inputRef.current?.focus();
    }
  }, [input, isStreaming, messages, formulaContext, conversationId, getToken]);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const displayedMessages = [...messages].reverse();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>

        <Text
          numberOfLines={1}
          style={[
            styles.headerTitle,
            {
              color: colors.foreground,
              fontFamily: nativeTheme.fontFamily.sansSemiBold,
            },
          ]}
        >
          {conversation?.title ?? 'Session'}
        </Text>

        <Pressable
          onPress={() => setShowContextPanel((v) => !v)}
          style={({ pressed }) => [
            styles.contextToggle,
            {
              backgroundColor: showContextPanel ? colors.accent : colors.muted,
              borderRadius: nativeTheme.radius,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather
            name="file-text"
            size={16}
            color={showContextPanel ? colors.accentForeground : colors.mutedForeground}
          />
        </Pressable>
      </View>

      {/* Formula context panel */}
      {showContextPanel ? (
        <View
          style={[
            styles.contextPanel,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.contextLabel,
              {
                color: colors.mutedForeground,
                fontFamily: nativeTheme.fontFamily.sansMedium,
              },
            ]}
          >
            Formula context (optional)
          </Text>
          <TextInput
            style={[
              styles.contextInput,
              {
                color: colors.foreground,
                backgroundColor: colors.background,
                borderColor: colors.border,
                fontFamily: nativeTheme.fontFamily.sans,
              },
            ]}
            placeholder="Paste ingredients, percentages, or notes…"
            placeholderTextColor={colors.mutedForeground}
            value={formulaContext}
            onChangeText={setFormulaContext}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      ) : null}

      {/* Messages */}
      {isLoading && messages.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={displayedMessages}
          keyExtractor={(item) => item.id}
          inverted={!!displayedMessages.length}
          scrollEnabled={!!displayedMessages.length}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.messageList}
          ListHeaderComponent={
            showTyping ? <TypingIndicator colors={colors} /> : null
          }
          ListFooterComponent={
            messages.length === 0 ? (
              <View style={styles.emptyChat}>
                <RNImage
                  source={require('../../assets/images/logo.png')}
                  style={styles.emptyIcon}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.emptyChatTitle,
                    {
                      color: colors.foreground,
                      fontFamily: nativeTheme.fontFamily.sansSemiBold,
                    },
                  ]}
                >
                  Ask your coach
                </Text>
                <Text
                  style={[
                    styles.emptyChatBody,
                    {
                      color: colors.mutedForeground,
                      fontFamily: nativeTheme.fontFamily.sans,
                    },
                  ]}
                >
                  Ask about structure, contrast, materials, dosage experiments, or evaluation
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View
                style={[
                  styles.messageRow,
                  isUser ? styles.userRow : styles.assistantRow,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isUser
                      ? [
                          styles.userBubble,
                          { backgroundColor: colors.accent },
                        ]
                      : [
                          styles.assistantBubble,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                        ],
                    item.isStreaming && styles.streamingBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      {
                        color: isUser
                          ? colors.accentForeground
                          : colors.foreground,
                        fontFamily: nativeTheme.fontFamily.sans,
                      },
                    ]}
                    selectable
                  >
                    {item.content}
                  </Text>
                  {item.isStreaming ? (
                    <View
                      style={[
                        styles.cursor,
                        { backgroundColor: colors.accent },
                      ]}
                    />
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Input bar */}
      <View
        style={[
          styles.inputBar,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: bottomPad + 8,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            {
              color: colors.foreground,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: nativeTheme.radius,
              fontFamily: nativeTheme.fontFamily.sans,
            },
          ]}
          placeholder="Ask your coach…"
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          blurOnSubmit={false}
          returnKeyType="default"
        />
        <Pressable
          onPress={sendMessage}
          disabled={!input.trim() || isStreaming}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor:
                input.trim() && !isStreaming ? colors.accent : colors.muted,
              borderRadius: nativeTheme.radius,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          {isStreaming ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <Feather
              name="send"
              size={18}
              color={
                input.trim() ? colors.accentForeground : colors.mutedForeground
              }
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 16 },
  contextToggle: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextPanel: {
    padding: 14,
    gap: 8,
    borderBottomWidth: 1,
  },
  contextLabel: { fontSize: 12 },
  contextInput: {
    borderWidth: 1,
    padding: 10,
    fontSize: 13,
    minHeight: 80,
    maxHeight: 140,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    flexGrow: 1,
  },
  messageRow: {
    marginVertical: 3,
  },
  userRow: { alignItems: 'flex-end' },
  assistantRow: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '84%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  userBubble: { borderColor: 'transparent' },
  assistantBubble: {},
  streamingBubble: { opacity: 0.9 },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  cursor: {
    width: 2,
    height: 18,
    marginLeft: 2,
    marginBottom: 2,
    opacity: 0.8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.5,
  },
  emptyChat: {
    paddingTop: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyChatTitle: { fontSize: 18 },
  emptyChatBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
