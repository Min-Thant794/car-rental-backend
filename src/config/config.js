require('dotenv').config();

const config = {
    PORT : process.env.PORT || 8100,
    MONGODB_URL : process.env.MONGODB_URL,
    SECRET_KEY : process.env.SECRET_KEY,
    JWT_SECRET_KEY : process.env.JWT_SECRET_KEY,
    JWT_EXPIRE_IN : process.env.JWT_EXPIRE_IN,
    SUPABASE_URL : process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE : process.env.SUPABASE_SERVICE_ROLE,
    SUPABASE_USER_BUCKET : process.env.SUPABASE_USER_BUCKET,
    SUPABASE_LICENSE_BUCKET : process.env.SUPABASE_LICENSE_BUCKET,
    SUPABASE_CAR_BUCKET : process.env.SUPABASE_CAR_BUCKET
}

module.exports = config