import { ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput,
  TextInputProps, View, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { couleur, espace, rayon, texte } from './theme';

export function Ecran({ children, sansScroll }: { children: ReactNode; sansScroll?: boolean }) {
  const contenu = sansScroll ? (
    <View style={styles.ecranContenu}>{children}</View>
  ) : (
    <ScrollView
      contentContainerStyle={styles.ecranContenu}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
  return <SafeAreaView style={styles.ecran} edges={['top', 'bottom']}>{contenu}</SafeAreaView>;
}

export function Titre({ children }: { children: ReactNode }) {
  return <Text style={[texte.titre, styles.titre]}>{children}</Text>;
}

export function SousTitre({ children }: { children: ReactNode }) {
  return <Text style={[texte.sousTitre, styles.sousTitre]}>{children}</Text>;
}

export function Paragraphe({ children, doux }: { children: ReactNode; doux?: boolean }) {
  return <Text style={[doux ? texte.doux : texte.corps, styles.paragraphe]}>{children}</Text>;
}

export function Bouton({
  titre, onPress, variante = 'principal', enCours, desactive,
}: {
  titre: string;
  onPress: () => void;
  variante?: 'principal' | 'accent' | 'discret';
  enCours?: boolean;
  desactive?: boolean;
}) {
  const inactif = desactive || enCours;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactif}
      style={({ pressed }) => [
        styles.bouton,
        variante === 'principal' && styles.boutonPrincipal,
        variante === 'accent' && styles.boutonAccent,
        variante === 'discret' && styles.boutonDiscret,
        pressed && styles.boutonPresse,
        inactif && styles.boutonInactif,
      ]}
    >
      {enCours ? (
        <ActivityIndicator color={variante === 'accent' ? couleur.accentEncre : couleur.fond} />
      ) : (
        <Text
          style={[
            styles.boutonTexte,
            variante === 'accent' && { color: couleur.accentEncre },
            variante === 'discret' && { color: couleur.encre },
          ]}
        >
          {titre}
        </Text>
      )}
    </Pressable>
  );
}

export function Champ({ etiquette, ...props }: TextInputProps & { etiquette: string }) {
  return (
    <View style={styles.champBloc}>
      <Text style={[texte.petit, styles.champEtiquette]}>{etiquette}</Text>
      <TextInput
        style={styles.champ}
        placeholderTextColor={couleur.encreDouce}
        {...props}
      />
    </View>
  );
}

export function Carte({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.carte, style]}>{children}</View>;
}

export function Message({ type, children }: { type: 'erreur' | 'info' | 'succes'; children: ReactNode }) {
  const fond = type === 'erreur' ? '#FDECEA' : type === 'succes' ? '#E7F4EF' : couleur.surface;
  const bord = type === 'erreur' ? couleur.alerte : type === 'succes' ? couleur.succes : couleur.bordure;
  return (
    <View style={[styles.message, { backgroundColor: fond, borderColor: bord }]}>
      <Text style={[texte.doux, { color: couleur.encre }]}>{children}</Text>
    </View>
  );
}

export function Attente({ texte: libelle }: { texte: string }) {
  return (
    <View style={styles.attente}>
      <ActivityIndicator color={couleur.encreDouce} />
      <Text style={[texte.doux, { marginTop: espace.sm }]}>{libelle}</Text>
    </View>
  );
}

export function Vide({ titre, detail }: { titre: string; detail: string }) {
  return (
    <View style={styles.vide}>
      <Text style={[texte.sousTitre, { textAlign: 'center' }]}>{titre}</Text>
      <Text style={[texte.doux, { textAlign: 'center', marginTop: espace.sm }]}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleur.fond },
  ecranContenu: { padding: espace.lg, paddingBottom: espace.xxl, flexGrow: 1 },
  titre: { marginBottom: espace.sm },
  sousTitre: { marginTop: espace.lg, marginBottom: espace.sm },
  paragraphe: { marginBottom: espace.md, lineHeight: 24 },
  bouton: {
    minHeight: 56, borderRadius: rayon.md, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: espace.lg, marginTop: espace.sm,
  },
  boutonPrincipal: { backgroundColor: couleur.encre },
  boutonAccent: { backgroundColor: couleur.accent },
  boutonDiscret: { backgroundColor: couleur.fond, borderWidth: 1, borderColor: couleur.bordure },
  boutonPresse: { opacity: 0.85 },
  boutonInactif: { opacity: 0.45 },
  boutonTexte: { color: couleur.fond, fontSize: 17, fontWeight: '700' },
  champBloc: { marginBottom: espace.md },
  champEtiquette: { marginBottom: espace.xs, textTransform: 'uppercase', letterSpacing: 0.6 },
  champ: {
    borderWidth: 1, borderColor: couleur.bordure, borderRadius: rayon.md,
    paddingHorizontal: espace.md, minHeight: 54, fontSize: 17, color: couleur.encre,
    backgroundColor: couleur.fond,
  },
  carte: {
    borderWidth: 1, borderColor: couleur.bordure, borderRadius: rayon.md,
    padding: espace.md, marginBottom: espace.md, backgroundColor: couleur.fond,
  },
  message: { borderWidth: 1, borderRadius: rayon.sm, padding: espace.md, marginBottom: espace.md },
  attente: { paddingVertical: espace.xl, alignItems: 'center' },
  vide: { paddingVertical: espace.xl, alignItems: 'center' },
});
