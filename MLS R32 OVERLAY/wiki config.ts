export const WIKI_PROMPT_VERSION = "32.0";

// Workers AI is kept below 90% for autonomous generation so the interactive
// Profesor IA retains a reserve. External providers can continue after this.
export const WIKI_CLOUDFLARE_NEURON_TARGET = 9000;
export const WIKI_CLAIM_TTL_MS = 2 * 60 * 60 * 1000;

// Queue architecture: one message represents up to eight encyclopedia entries.
export const WIKI_ENTRIES_PER_MESSAGE = 8;
// FIFO estricto: solo puede existir un mensaje físico activo. Cada mensaje
// conserva hasta ocho códigos consecutivos para amortizar el costo de Queue.
export const WIKI_QUEUE_BACKLOG_CLOUDFLARE_ONLY = 1;
export const WIKI_QUEUE_BACKLOG_EXTERNAL_SMALL = 1;
export const WIKI_QUEUE_BACKLOG_EXTERNAL_MEDIUM = 1;
export const WIKI_QUEUE_BACKLOG_EXTERNAL_LARGE = 1;

export const WIKI_LANGUAGE_ORDER = [
	{ slug: "espanol-guatemala", name: "Español de Guatemala", total: 930, prefix: "MLS-V10" },
	{ slug: "ingles", name: "Inglés", total: 766, prefix: "MLS-V01" },
	{ slug: "portugues", name: "Portugués brasileño", total: 1199, prefix: "MLS-V02" },
	{ slug: "italiano", name: "Italiano", total: 810, prefix: "MLS-V03" },
	{ slug: "frances", name: "Francés", total: 1159, prefix: "MLS-V04" },
	{ slug: "aleman", name: "Alemán", total: 1101, prefix: "MLS-V05" },
	{ slug: "japones", name: "Japonés", total: 1027, prefix: "MLS-V06" },
	{ slug: "chino-taiwan", name: "Chino mandarín de Taiwán", total: 1016, prefix: "MLS-V07" },
	{ slug: "coreano", name: "Coreano", total: 1094, prefix: "MLS-V08" },
	{ slug: "ruso", name: "Ruso", total: 1031, prefix: "MLS-V09" },
] as const;

export const WIKI_TOTAL_ENTRIES = WIKI_LANGUAGE_ORDER.reduce((sum, item) => sum + item.total, 0);
