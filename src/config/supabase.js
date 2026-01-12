const {createClient} = require("@supabase/supabase-js");
const config =  require("./config");
const multer = require("multer");

const supabaseClient = createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE
);

const fileStorage = supabaseClient.storage.from(config.SUPABASE_BUCKET);

const upload = multer({ storage: multer.memoryStorage()});

const uploadImage = async (file) => {
    try {
        const fileName = `${Date.now()}-${file.originalname}`;

        
        const { data, error } = await fileStorage.upload(
            fileName,
            file.buffer,
            {
                contentType: file.mimetype,
                upsert: true
            }
        );


        if (error) {
            console.log("Failed to upload image to SupaBase!", error);
            throw error;
        }

        const { data: publicUrl } = fileStorage.getPublicUrl(fileName);

        console.log("Public Url: ", publicUrl.publicUrl);
        
        return publicUrl.publicUrl;

    } catch (error) {
        console.log("Upload Image Error: ", error);
    }
}

const uploadImages = async (files) => {
    try {
        // const fileStorage = supabaseClient.storage.from(config.SUPABASE_BUCKET);
        const uploadedUrls = [];
        for (const file of files) {
            const fileName = `${Date.now()}-${file.originalname}`;
            const { data, error } = await fileStorage.upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

            if (error) {
                console.log("Failed to upload images: ", error);
                throw error
            }

            const { data: publicUrl } = fileStorage.getPublicUrl(fileName);
            uploadedUrls.push(publicUrl.publicUrl);
        }
        return uploadedUrls;
    } catch (error) {
        console.log("uploadImages() error: ", error);
    }
}

const deleteImage = async(imageUrl) => {
    try {
        if(!imageUrl) return;
        const bucketName = config.SUPABASE_BUCKET;

        const filePath = imageUrl.split(`/object/public/${bucketName}/`)[1];

        if(!filePath) {
            console.warn("Invalid Supabase URL: ", imageUrl);
            return;
        }

        const { data, error} = await supabaseClient
        .storage
        .from(bucketName)
        .remove([filePath]);

        if(error) {
            console.error("Supabase delete failed: ", error);
            throw error;
        }
        console.log("deleted image from supabase", filePath);
        return true;

    } catch (error) {
        console.log("supaBase deleteImage() error!", error);
    }
}

const testSupabaseConnection = async() => {
    const { data, error } = await supabaseClient.storage.listBuckets();
    if(error) {
        console.log("Supabase connection failed: ", error.message);
    } else {
        console.log("Supabase connection OK. Buckets: ", data.map(b => b.name));
    }
}

module.exports = {
  uploadImage,
  uploadImages,
  uploadMultiple: upload.array("images", 10),
  testSupabaseConnection,
  deleteImage
};
