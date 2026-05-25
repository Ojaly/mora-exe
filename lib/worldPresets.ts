import { WorldPresetKey } from "@/types";

export interface WorldPreset {
  key: WorldPresetKey;
  label: string;
  description: string;
  accentColor: string;
  deepPrompt: string;
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
    deepPrompt: "Lens: cyber melancholy. Wet streets reflecting neon at 3am. Urban loneliness inside a digital shell. Signal degradation as emotion. Every image should feel like a CRT screen through rain.",
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
    deepPrompt: "Lens: corporate perfection masking controlled emotion. Luxury dystopia. Fluorescent warmth at 11pm. Performance review as existential dread. Write with polished surface over hollow core.",
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
    deepPrompt: "Lens: mythic scale and legendary tone. Cinematic destiny. Sacrifice honored by silence. Ancient names spoken once. Write with the weight of fading empires and last oaths.",
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
    deepPrompt: "Lens: digital Motown. Groove warmth rebuilt in a DAW. Retro-futuristic soul. The ache of reaching for something human through a machine. Write with rhythm in the body, not the head.",
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
    deepPrompt: "Lens: rotational rhythm, elegant melancholy. Ballroom atmosphere corrupted by static. Aristocratic decay. Write with 3/4 cadence in mind — lines should feel like they turn.",
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
    deepPrompt: "Lens: sacred language for secular pain. Redemption irony — the sermon that admits doubt. Gospel energy without religion. Write with communal intensity: the congregation knows the cost.",
    styleOverrides: {
      texture: "warm tube saturation, live room ambience, call-and-response, communal energy",
      instruments: "Hammond organ, handclaps, gospel choir, upright bass, snare on 2 and 4",
      note: "Aesthetic: Sunday service for the broken, sacred language for secular pain, redemption irony",
    },
  },
};
