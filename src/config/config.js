require('dotenv').config();

const config = {
    PORT : process.env.PORT || 8100,
    MONGODB_URL : process.env.MONGODB_URL,
    CLIENT_APP_URL: process.env.CLIENT_APP_URL,
    SECRET_KEY : process.env.SECRET_KEY,
    JWT_SECRET_KEY : process.env.JWT_SECRET_KEY,
    JWT_EXPIRE_IN : process.env.JWT_EXPIRE_IN,
    SUPABASE_URL : process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE : process.env.SUPABASE_SERVICE_ROLE,
    SUPABASE_USER_BUCKET : process.env.SUPABASE_USER_BUCKET,
    SUPABASE_LICENSE_BUCKET : process.env.SUPABASE_LICENSE_BUCKET,
    SUPABASE_CAR_BUCKET : process.env.SUPABASE_CAR_BUCKET,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_APP_PASS: process.env.EMAIL_APP_PASS,
    REDIS_USERNAME: process.env.REDIS_USERNAME,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
}

module.exports = config