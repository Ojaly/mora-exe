import { WorldPresetKey } from "@/types";

export interface WorldPreset {
  key: WorldPresetKey;
  label: string;
  description: string;
  accentColor: string;
  styleOverrides: {
    texture?: string;
    instruments?: string;
    note?: string;
  };
}

export const WORLD_PRESETS: Record<WorldPresetKey, WorldPreset> = {
  neon: {
    key: "neon",
    label: "NEON",
    description: "Synthwave / Cyberpunk City",
    accentColor: "#06b6d4",
    styleOverrides: {
      texture: "neon-soaked, reverb-drenched, cold digital space, tape echo",
      instruments: "analog synths, vocoder, 808 bass, arpeggiated leads, drum machine",
      note: "Aesthetic: wet streets reflecting neon, 80s cyberpunk, cold city loneliness",
    },
  },
  corporate: {
    key: "corporate",
    label: "CORP",
    description: "Corporate Dystopia Pop",
    accentColor: "#94a3b8",
    styleOverrides: {
      texture: "sterile, polished, bright compression, fluorescent warmth",
      instruments: "clean electric piano, programmed drums, muted synth bass, acoustic guitar sample",
      note: "Aesthetic: open-plan office at 11pm, performance review dread, forced positivity",
    },
  },
  mythic: {
    key: "mythic",
    label: "MYTH",
    description: "Dark Fantasy / Epic Scale",
    accentColor: "#a78bfa",
    styleOverrides: {
      texture: "vast hall reverb, cinematic depth, dynamic swells, wide stereo field",
      instruments: "epic brass, choral voices, war drums, orchestral strings, solo violin",
      note: "Aesthetic: ancient battle, mythological weight, sacrifice and glory, fading empires",
    },
  },
  "digital-motown": {
    key: "digital-motown",
    label: "MTWN",
    description: "Digital Motown / Neo-Soul",
    accentColor: "#f97316",
    styleOverrides: {
      texture: "warm vinyl texture, tight groove, lush backing vocals, tube saturation",
      instruments: "Rhodes piano, drum machine, bass guitar, gospel harmony, talk box",
      note: "Aesthetic: Motown soul rebuilt with digital tools, humanized sequencer, ache and joy",
    },
  },
  "electro-waltz": {
    key: "electro-waltz",
    label: "WALTZ",
    description: "Baroque Electronic / 3/4 Time",
    accentColor: "#f0abfc",
    styleOverrides: {
      texture: "3/4 time signature, elegant yet glitched, Viennese ballroom corrupted by static",
      instruments: "harpsichord samples, electronic strings, waltz drum pattern, music box, cello",
      note: "Aesthetic: aristocratic decay, ballroom inside a server room, time signature 3/4",
    },
  },
  "gospel-irony": {
    key: "gospel-irony",
    label: "GOSP",
    description: "Gospel Irony / Sacred × Secular",
    accentColor: "#fbbf24",
    styleOverrides: {
      texture: "warm tube saturation, live room ambience, call-and-response, communal energy",
      instruments: "Hammond organ, handclaps, gospel choir, upright bass, snare on 2 and 4",
      note: "Aesthetic: Sunday service for the broken, sacred language for secular pain, redemption irony",
    },
  },
};
