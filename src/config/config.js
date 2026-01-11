require('dotenv').config();

const config = {
    PORT : process.env.PORT || 8100,
    MONGODB_URL : process.env.MONGODB_URL,
    SECRET_KEY : process.env.SECRET_KEY,
    SUPABASE_URL : process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE : process.env.SUPABASE_SERVICE_ROLE,
    SUPABASE_BUCKET : process.env.SUPABASE_BUCKET
}

module.exports = config