CREATE TYPE user_role AS ENUM ('student', 'mentor', 'admin');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(255),
    bio TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    role user_role NOT NULL,
    bookmarks TEXT[],
    email VARCHAR(255) UNIQUE NOT NULL,
    interested_field TEXT
);