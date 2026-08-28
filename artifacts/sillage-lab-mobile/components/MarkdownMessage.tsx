import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@workspace/s1/hooks/use-colors';
import { nativeTheme } from '@workspace/s1/lib/native-theme';
import { Typography, type TypographyVariant } from '@workspace/s1/components/native/typography';

type MarkdownMessageProps = {
  content: string;
};

type MarkdownBlock =
  | { type: 'heading'; level: number; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'list'; ordered: boolean; items: string[] };

type InlineSegment = {
  text: string;
  emphasis?: 'strong' | 'emphasis' | 'code';
};

function parseBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let activeList: Extract<MarkdownBlock, { type: 'list' }> | null = null;

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', content: paragraphLines.join('\n') });
      paragraphLines = [];
    }
  };

  const flushList = () => {
    if (activeList) {
      blocks.push(activeList);
      activeList = null;
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      });
      continue;
    }

    const listMatch = line.match(/^\s*(?:([-+*])|(\d+[.)]))\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      const ordered = Boolean(listMatch[2]);
      if (!activeList || activeList.ordered !== ordered) {
        flushList();
        activeList = { type: 'list', ordered, items: [] };
      }
      activeList.items.push(listMatch[3]);
      continue;
    }

    // Keep indented continuation lines with the previous list item.
    if (activeList && /^\s{2,}\S/.test(line)) {
      const lastItem = activeList.items.length - 1;
      if (lastItem >= 0) {
        activeList.items[lastItem] += `\n${trimmedLine}`;
        continue;
      }
    }

    flushList();
    paragraphLines.push(trimmedLine);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function parseInline(content: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const pattern =
    /(\*\*(.+?)\*\*|__(.+?)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: content.slice(lastIndex, match.index) });
    }

    if (match[2] !== undefined) {
      segments.push({ text: match[2], emphasis: 'strong' });
    } else if (match[3] !== undefined) {
      segments.push({ text: match[3], emphasis: 'strong' });
    } else if (match[4] !== undefined) {
      segments.push({ text: match[4], emphasis: 'code' });
    } else if (match[5] !== undefined) {
      segments.push({ text: match[5], emphasis: 'emphasis' });
    } else if (match[6] !== undefined) {
      segments.push({ text: match[6], emphasis: 'emphasis' });
    } else if (match[7] !== undefined && match[8] !== undefined) {
      // Coach content is untrusted. Keep the readable link label without
      // dispatching the supplied URL to the device or browser.
      segments.push({ text: match[7] });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({ text: content.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ text: content }];
}

function InlineText({
  content,
  colors,
}: {
  content: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <>
      {parseInline(content).map((segment, index) => {
        const segmentStyle = [
          segment.emphasis === 'strong' && {
            color: colors.foreground,
            fontFamily: nativeTheme.fontFamily.sansSemiBold,
          },
          segment.emphasis === 'emphasis' && styles.italic,
          segment.emphasis === 'code' && {
            backgroundColor: colors.muted,
            fontFamily: nativeTheme.fontFamily.sansMedium,
          },
        ];

        return (
          <Text key={`${segment.text}-${index}`} style={segmentStyle}>
            {segment.text}
          </Text>
        );
      })}
    </>
  );
}

export const MarkdownMessage = React.memo(function MarkdownMessage({
  content,
}: MarkdownMessageProps) {
  const colors = useColors();
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <View style={styles.root}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const headingVariant: TypographyVariant =
            block.level === 1
              ? 'h1'
              : block.level === 2
                ? 'h2'
                : 'h3';

          return (
            <View key={`heading-${index}`} style={styles.heading}>
              <Typography variant={headingVariant}>
                <InlineText content={block.content} colors={colors} />
              </Typography>
            </View>
          );
        }

        if (block.type === 'list') {
          return (
            <View key={`list-${index}`} style={styles.list}>
              {block.items.map((item, itemIndex) => (
                <View key={`item-${itemIndex}`} style={styles.listItem}>
                  <View style={styles.listMarker}>
                    <Typography variant="body">
                      <Text style={{ color: colors.accent }}>
                        {block.ordered ? `${itemIndex + 1}.` : '•'}
                      </Text>
                    </Typography>
                  </View>
                  <View style={styles.listContent}>
                    <Typography variant="body">
                      <InlineText content={item} colors={colors} />
                    </Typography>
                  </View>
                </View>
              ))}
            </View>
          );
        }

        return (
          <View key={`paragraph-${index}`} style={styles.paragraph}>
            <Typography variant="body">
              <InlineText content={block.content} colors={colors} />
            </Typography>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  paragraph: {
    marginBottom: nativeTheme.spacing * 3,
  },
  heading: {
    marginBottom: nativeTheme.spacing * 2,
  },
  list: {
    marginBottom: nativeTheme.spacing * 3,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: nativeTheme.spacing,
  },
  listMarker: {
    width: nativeTheme.spacing * 5,
  },
  listContent: {
    flex: 1,
  },
  italic: {
    fontStyle: 'italic',
  },
});