<script setup lang="ts">
import { computed } from 'vue';

export interface ReviewCardData {
  id: string;
  author?: string | null;
  authorCarrera?: string | null;
  foodScore: number;
  serviceScore: number;
  priceScore: number;
  comment?: string | null;
  title?: string | null;
  imageUrl?: string | null;
  sentiment?: string | null;
  managerReply?: string | null;
  createdAt: string;
  establishmentName?: string | null;
}

const props = withDefaults(defineProps<{
  review: ReviewCardData;
  /** Show author info (name, avatar, carrera). Hide when it's "my reviews" */
  showAuthor?: boolean;
  /** Show establishment name instead of author (for my-reviews) */
  showEstablishment?: boolean;
  /** Show the sentiment badge */
  showSentiment?: boolean;
  /** Enable clicking on image to open lightbox */
  clickableImage?: boolean;
}>(), {
  showAuthor: true,
  showEstablishment: false,
  showSentiment: false,
  clickableImage: false,
});

const emit = defineEmits<{
  (e: 'image-click', reviewId: string): void;
}>();

const initials = computed(() => {
  const name = props.showEstablishment
    ? props.review.establishmentName
    : props.review.author;
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
});

const displayName = computed(() => {
  if (props.showEstablishment) return props.review.establishmentName || 'Establecimiento';
  return props.review.author || 'Estudiante';
});

const formattedDate = computed(() =>
  new Date(props.review.createdAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
);

const avgScore = computed(() =>
  ((props.review.foodScore + props.review.serviceScore + props.review.priceScore) / 3).toFixed(1)
);

const sentimentLabel = computed(() => {
  const s = props.review.sentiment;
  if (s === 'positive') return 'Positiva';
  if (s === 'negative') return 'Negativa';
  if (s === 'neutral') return 'Neutral';
  return null;
});

const sentimentClasses = computed(() => {
  const s = props.review.sentiment;
  if (s === 'positive') return 'rc-sentiment--positive';
  if (s === 'negative') return 'rc-sentiment--negative';
  return 'rc-sentiment--neutral';
});

const handleImageClick = () => {
  if (props.clickableImage) {
    emit('image-click', props.review.id);
  }
};
</script>

<template>
  <article class="rc">
    <!-- Top accent gradient -->
    <div class="rc__accent"></div>

    <div class="rc__body">
      <!-- Header: Establishment mode (big name) -->
      <div v-if="showEstablishment" class="rc__header-est">
        <div class="rc__est-top">
          <div class="rc__est-info">
            <h3 class="rc__est-name brand">{{ displayName }}</h3>
            <p class="rc__date">{{ formattedDate }}</p>
          </div>
          <div class="rc__rating-group">
            <slot name="header-actions" />
            <div class="rc__avg-badge">
              <span class="rc__avg-number">{{ avgScore }}</span>
              <div class="rc__stars">
                <span
                  v-for="n in 5"
                  :key="n"
                  class="material-symbols-outlined rc__star"
                  :style="{ fontVariationSettings: `'FILL' ${n <= review.foodScore ? 1 : 0}` }"
                >star</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Header: Author mode (avatar + name) -->
      <div v-else class="rc__header">
        <div class="rc__author">
          <div class="rc__avatar">{{ initials }}</div>
          <div>
            <h4 class="rc__name brand">{{ displayName }}</h4>
            <p v-if="showAuthor && review.authorCarrera" class="rc__carrera">
              {{ review.authorCarrera }} · UAO
            </p>
            <p class="rc__date">{{ formattedDate }}</p>
          </div>
        </div>

        <div class="rc__rating-group">
          <slot name="header-actions" />
          <div class="rc__avg-badge">
            <span class="rc__avg-number">{{ avgScore }}</span>
            <div class="rc__stars">
              <span
                v-for="n in 5"
                :key="n"
                class="material-symbols-outlined rc__star"
                :style="{ fontVariationSettings: `'FILL' ${n <= review.foodScore ? 1 : 0}` }"
              >star</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Score chips -->
      <div class="rc__scores">
        <div class="rc__chip rc__chip--food">
          <span class="material-symbols-outlined rc__chip-icon" style="font-variation-settings:'FILL' 1;">restaurant</span>
          <span class="rc__chip-label">Comida</span>
          <span class="rc__chip-value">{{ review.foodScore }}/5</span>
        </div>
        <div class="rc__chip rc__chip--service">
          <span class="material-symbols-outlined rc__chip-icon" style="font-variation-settings:'FILL' 1;">support_agent</span>
          <span class="rc__chip-label">Servicio</span>
          <span class="rc__chip-value">{{ review.serviceScore }}/5</span>
        </div>
        <div class="rc__chip rc__chip--price">
          <span class="material-symbols-outlined rc__chip-icon" style="font-variation-settings:'FILL' 1;">payments</span>
          <span class="rc__chip-label">Precio</span>
          <span class="rc__chip-value">{{ review.priceScore }}/5</span>
        </div>
      </div>

      <!-- Sentiment badge -->
      <div v-if="showSentiment && sentimentLabel" class="rc__sentiment-row">
        <span class="rc__sentiment" :class="sentimentClasses">
          <span class="material-symbols-outlined" style="font-size:13px;">psychology</span>
          {{ sentimentLabel }}
        </span>
      </div>

      <!-- Title -->
      <p v-if="review.title" class="rc__title">{{ review.title }}</p>

      <!-- Slot for inline content (e.g. edit forms) -->
      <slot name="inline" />

      <!-- Comment -->
      <div v-if="review.comment" class="rc__comment">
        <p>{{ review.comment }}</p>
      </div>

      <!-- Evidence image -->
      <div v-if="review.imageUrl" class="rc__image-wrap">
        <img
          :src="review.imageUrl"
          class="rc__image"
          :class="{ 'rc__image--clickable': clickableImage }"
          @click="handleImageClick"
          alt="Evidencia de la reseña"
        />
      </div>

      <!-- Actions slot (reply button etc.) -->
      <slot name="actions" />

      <!-- Manager Reply -->
      <div v-if="review.managerReply" class="rc__reply">
        <div class="rc__reply-bar"></div>
        <div class="rc__reply-content">
          <div class="rc__reply-head">
            <span class="material-symbols-outlined rc__reply-icon">reply</span>
            <span class="rc__reply-label brand">Respuesta Oficial</span>
            <slot name="reply-badge" />
          </div>
          <p class="rc__reply-text">"{{ review.managerReply }}"</p>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════════
   ReviewCard — Dark premium design
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─── Shell ────────────────────────────────────────────────────────────────── */
.rc {
  background: linear-gradient(145deg, #282829 0%, #282829 100%);
  border-radius: 1.5rem;
  overflow: hidden;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.rc:hover {
  transform: translateY(-4px);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(249, 115, 22, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

/* ─── Accent ───────────────────────────────────────────────────────────────── */
.rc__accent {
  height: 3px;
  background: linear-gradient(90deg, #f97316, #f59e0b, #f97316);
  background-size: 200% 100%;
  animation: rc-shimmer 4s ease-in-out infinite;
}

@keyframes rc-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* ─── Body ─────────────────────────────────────────────────────────────────── */
.rc__body {
  padding: 1.5rem;
}

/* ─── Header: Establishment mode ───────────────────────────────────────────── */
.rc__header-est {
  margin-bottom: 1.25rem;
}

.rc__est-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.rc__est-info {
  min-width: 0;
}

.rc__est-name {
  font-weight: 900;
  color: #faf9f6;
  font-size: 1.5rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

/* ─── Header: Author mode ──────────────────────────────────────────────────── */
.rc__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.rc__author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.rc__avatar {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);
}

.rc__name {
  font-weight: 800;
  color: #faf9f6;
  font-size: 0.95rem;
  line-height: 1.2;
}

.rc__carrera {
  font-size: 0.72rem;
  color: #f97316;
  font-weight: 600;
  margin-top: 2px;
}

.rc__date {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 3px;
  letter-spacing: 0.02em;
}

/* ─── Rating Group ─────────────────────────────────────────────────────────── */
.rc__rating-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.rc__avg-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.rc__avg-number {
  font-size: 1.6rem;
  font-weight: 900;
  color: #f97316;
  line-height: 1;
  font-family: 'Manrope', sans-serif;
}

.rc__stars {
  display: flex;
  gap: 1px;
}

.rc__star {
  font-size: 14px;
  color: #f97316;
}

/* ─── Score Chips ──────────────────────────────────────────────────────────── */
.rc__scores {
  display: flex;
  gap: 0.625rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.rc__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.875rem;
  font-weight: 700;
  border: 1px solid;
  letter-spacing: 0.015em;
  transition: background 0.2s, transform 0.2s;
}

.rc__chip:hover {
  transform: translateY(-1px);
}

.rc__chip-icon { font-size: 18px; }

.rc__chip-label {
  font-size: 0.8rem;
  opacity: 0.85;
}

.rc__chip-value {
  font-size: 0.95rem;
  font-weight: 900;
  font-family: 'Manrope', sans-serif;
}

.rc__chip--food {
  background: rgba(249, 115, 22, 0.1);
  border-color: rgba(249, 115, 22, 0.2);
  color: #fb923c;
}
.rc__chip--food .rc__chip-icon { color: #f97316; }

.rc__chip--service {
  background: rgba(96, 165, 250, 0.1);
  border-color: rgba(96, 165, 250, 0.2);
  color: #93bbfd;
}
.rc__chip--service .rc__chip-icon { color: #60a5fa; }

.rc__chip--price {
  background: rgba(52, 211, 153, 0.1);
  border-color: rgba(52, 211, 153, 0.2);
  color: #6ee7b7;
}
.rc__chip--price .rc__chip-icon { color: #34d399; }

/* ─── Sentiment ────────────────────────────────────────────────────────────── */
.rc__sentiment-row {
  margin-bottom: 0.75rem;
}

.rc__sentiment {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 700;
  border: 1px solid;
}

.rc-sentiment--positive {
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  border-color: rgba(52, 211, 153, 0.2);
}

.rc-sentiment--negative {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.2);
}

.rc-sentiment--neutral {
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

/* ─── Title ────────────────────────────────────────────────────────────────── */
.rc__title {
  font-weight: 700;
  color: #faf9f6;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  font-family: 'Manrope', sans-serif;
}

/* ─── Comment ──────────────────────────────────────────────────────────────── */
.rc__comment {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.rc__comment p {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.9rem;
  line-height: 1.75;
}

/* ─── Image ────────────────────────────────────────────────────────────────── */
.rc__image-wrap {
  margin-bottom: 1rem;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.rc__image {
  width: 100%;
  max-height: 16rem;
  object-fit: cover;
  transition: opacity 0.3s, transform 0.5s ease;
  display: block;
}

.rc__image--clickable:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

/* ─── Manager Reply ────────────────────────────────────────────────────────── */
.rc__reply {
  position: relative;
  padding-left: 1.25rem;
  margin-top: 0.75rem;
}

.rc__reply-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #f97316, #f59e0b);
  border-radius: 99px;
}

.rc__reply-content {
  background: rgba(249, 115, 22, 0.05);
  border: 1px solid rgba(249, 115, 22, 0.12);
  border-radius: 1rem;
  padding: 1rem;
}

.rc__reply-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.rc__reply-icon {
  font-size: 14px;
  color: #f97316;
}

.rc__reply-label {
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #f97316;
}

.rc__reply-text {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.85rem;
  font-style: italic;
  line-height: 1.65;
}

/* ─── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .rc__header, .rc__est-top { flex-direction: column; gap: 0.75rem; }
  .rc__rating-group { justify-content: space-between; width: 100%; }
  .rc__body { padding: 1.25rem; }
  .rc__scores { gap: 0.375rem; }
  .rc__est-name { font-size: 1.25rem; }
  .rc__chip { padding: 0.4rem 0.75rem; }
  .rc__chip-label { font-size: 0.72rem; }
  .rc__chip-value { font-size: 0.82rem; }
}
</style>
