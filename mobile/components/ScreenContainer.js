import React from 'react';
import { ScrollView, StyleSheet, View, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';

export default function ScreenContainer({ children, refreshing, onRefresh, scroll = true, keyboardAvoiding = false }) {
  const inner = <View style={styles.inner}>{children}</View>;

  const scrollable = (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        ) : undefined
      }
    >
      {inner}
    </ScrollView>
  );

  const content = scroll ? scrollable : inner;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  flex:   { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  inner:  { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
