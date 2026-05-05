-- =========================================
-- INITIAL CLEANUP (Idempotency)
-- =========================================
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_establishments_updated_at ON establishments;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS update_establishment_posts_updated_at ON establishment_posts;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS review_likes;
DROP TABLE IF EXISTS training_runs;
DROP TABLE IF EXISTS metrics_snapshots;
DROP TABLE IF EXISTS sentiment_results;
DROP TABLE IF EXISTS model_versions;
DROP TABLE IF EXISTS establishment_posts;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS establishments;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS sentiment_label;
DROP TYPE IF EXISTS training_status;

-- =========================================
-- EXTENSIONS
-- =========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- UTILITY FUNCTIONS
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE user_role AS ENUM ('student', 'manager', 'admin');
CREATE TYPE sentiment_label AS ENUM ('positive', 'negative', 'neutral');
CREATE TYPE training_status AS ENUM ('running', 'success', 'failed');

-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 varchar(120) NOT NULL,
  username             varchar(50)  UNIQUE NOT NULL,
  email                varchar(150) UNIQUE NOT NULL,
  password_hash        text NOT NULL,
  role                 user_role NOT NULL,
  is_active            boolean NOT NULL DEFAULT true,
  avatar_url           text,
  bio                  text,
  university_id        text,
  carrera              varchar(100),
  verification_code    varchar(6),
  verification_expires timestamptz,
  is_verified          boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users(role);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =========================================
-- USER SESSIONS
-- =========================================
CREATE TABLE user_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token text NOT NULL,
  is_revoked    boolean NOT NULL DEFAULT false,
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_revoked ON user_sessions(is_revoked) WHERE is_revoked = false;

-- =========================================
-- ESTABLISHMENTS
-- =========================================
CREATE TABLE establishments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             varchar(150) NOT NULL,
  slug             varchar(200) UNIQUE,
  description      text,
  category         varchar(80),
  manager_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  university_id    varchar(100),
  location_details text,
  opening_hours    text,
  gallery_urls     text[] DEFAULT '{}',
  menu_urls        text[] DEFAULT '{}',
  logo_url         text,
  cover_url        text,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_establishments_manager ON establishments(manager_id);
CREATE INDEX idx_establishments_active ON establishments(is_active);

CREATE TRIGGER update_establishments_updated_at
  BEFORE UPDATE ON establishments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =========================================
-- ESTABLISHMENT POSTS
-- =========================================
CREATE TABLE establishment_posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  author_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content          text NOT NULL,
  image_urls       text[] DEFAULT '{}',
  is_published     boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_establishment_posts_establishment_created
  ON establishment_posts(establishment_id, created_at DESC);

CREATE TRIGGER update_establishment_posts_updated_at
  BEFORE UPDATE ON establishment_posts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =========================================
-- REVIEWS
-- =========================================
CREATE TABLE reviews (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  food_score       smallint NOT NULL CHECK (food_score BETWEEN 1 AND 5),
  service_score    smallint NOT NULL CHECK (service_score BETWEEN 1 AND 5),
  price_score      smallint NOT NULL CHECK (price_score BETWEEN 1 AND 5),
  title            varchar(100),
  comment          text NOT NULL,
  manager_reply    text,
  manager_reply_at timestamptz,
  image_url        text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
  -- @@unique([user_id, establishment_id]) deshabilitado: se permiten múltiples reseñas por usuario
);

CREATE INDEX idx_reviews_establishment ON reviews(establishment_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_reviews_establishment_created
  ON reviews(establishment_id, created_at DESC);

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =========================================
-- REVIEW LIKES
-- =========================================
CREATE TABLE review_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id  uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, review_id)
);

CREATE INDEX idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX idx_review_likes_user_id   ON review_likes(user_id);

-- =========================================
-- NOTIFICATIONS
-- =========================================
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id  uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  type       varchar(50) NOT NULL DEFAULT 'manager_reply',
  actor_name varchar(255),
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

-- =========================================
-- MODEL VERSIONS
-- =========================================
CREATE TABLE model_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version      varchar(20) UNIQUE NOT NULL,
  accuracy     numeric(5,4),
  precision    numeric(5,4),
  recall       numeric(5,4),
  f1           numeric(5,4),
  dataset_size int NOT NULL,
  trained_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- =========================================
-- SENTIMENT RESULTS
-- =========================================
CREATE TABLE sentiment_results (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id        uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  model_version_id uuid NOT NULL REFERENCES model_versions(id) ON DELETE CASCADE,
  predicted_label  sentiment_label NOT NULL,
  probability      numeric(5,4) NOT NULL CHECK (probability BETWEEN 0 AND 1),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sentiment_review         ON sentiment_results(review_id);
CREATE INDEX idx_sentiment_model_version  ON sentiment_results(model_version_id);

-- =========================================
-- METRICS SNAPSHOTS
-- =========================================
CREATE TABLE metrics_snapshots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  ige              numeric(5,2) CHECK (ige BETWEEN 0 AND 100),
  avg_food         numeric(4,2),
  avg_service      numeric(4,2),
  avg_price        numeric(4,2),
  negative_ratio   numeric(5,4) CHECK (negative_ratio BETWEEN 0 AND 1),
  total_reviews    int NOT NULL DEFAULT 0,
  negative_terms   jsonb,
  snapshot_date    date NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_snapshot_per_day UNIQUE(establishment_id, snapshot_date)
);

CREATE INDEX idx_metrics_establishment_date
  ON metrics_snapshots(establishment_id, snapshot_date DESC);

-- =========================================
-- TRAINING RUNS
-- =========================================
CREATE TABLE training_runs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id uuid REFERENCES model_versions(id) ON DELETE SET NULL,
  started_at       timestamptz,
  finished_at      timestamptz,
  status           training_status NOT NULL,
  error_message    text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_training_runs_model_version ON training_runs(model_version_id);
CREATE INDEX idx_training_runs_status        ON training_runs(status);
