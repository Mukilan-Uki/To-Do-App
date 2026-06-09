import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DoNowButton from '../components/DoNowButton';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/apiService';
import { API_URL } from '../config/constants';
import { colors, spacing, radius } from '../theme/colors';
import { typography } from '../theme/typography';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }
    if (isRegister && !name.trim()) {
      Alert.alert('Missing name', 'Please enter your full name.');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await register(name.trim(), email.trim().toLowerCase(), password);
      } else {
        await login(email.trim().toLowerCase(), password);
      }
    } catch (e) {
      Alert.alert('Sign in failed', getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>D</Text>
            </View>
            <View style={styles.brandRow}>
              <Text style={typography.brandDo}>Do</Text>
              <Text style={typography.brandNow}>(es)</Text>
            </View>
            <Text style={styles.tagline}>Your productivity companion</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.heading}>{isRegister ? 'Create account' : 'Welcome back'}</Text>
            <Text style={styles.sub}>
              {isRegister ? 'Sign up with the same email as the web app.' : 'Sign in with your web app account.'}
            </Text>

            {isRegister && (
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passWrap}>
                <TextInput
                  style={[styles.input, styles.passInput]}
                  placeholder="Password"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.passToggle}>
                  <Text style={styles.passToggleText}>{showPass ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <DoNowButton
              title={isRegister ? 'Create Account' : 'Sign In'}
              onPress={submit}
              loading={loading}
              style={styles.btn}
            />

            <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.switchBtn}>
              <Text style={styles.switchText}>
                {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={styles.switchLink}>{isRegister ? 'Sign In' : 'Register'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.apiHint}>API: {API_URL}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  flex:    { flex: 1 },
  scroll:  { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },

  logoWrap:   { alignItems: 'center', marginBottom: spacing.xl },
  logoBox:    {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  logoLetter: { color: '#fff', fontSize: 34, fontWeight: '900' },
  brandRow:   { flexDirection: 'row', alignItems: 'baseline' },
  tagline:    { fontSize: 13, color: colors.mutedForeground, marginTop: spacing.xs, fontWeight: '500' },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1, shadowRadius: 24, elevation: 6,
  },
  heading: { ...typography.h2, marginBottom: spacing.xs },
  sub:     { ...typography.bodyMuted, marginBottom: spacing.lg },

  fieldWrap: { marginBottom: spacing.md },
  label:     { fontSize: 13, fontWeight: '700', color: colors.foreground, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.foreground,
  },
  passWrap:       { position: 'relative' },
  passInput:      { paddingRight: 70 },
  passToggle:     { position: 'absolute', right: spacing.md, top: 0, bottom: 0, justifyContent: 'center' },
  passToggleText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  btn:        { marginTop: spacing.sm, marginBottom: spacing.md },
  switchBtn:  { alignItems: 'center', paddingVertical: spacing.xs },
  switchText: { fontSize: 14, color: colors.mutedForeground, fontWeight: '500' },
  switchLink: { color: colors.primary, fontWeight: '700' },

  apiHint: { fontSize: 10, color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.xl, opacity: 0.6 },
});
