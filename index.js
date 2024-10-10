const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();
const cloudinary = require('cloudinary').v2;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
cloudinary.config({
    cloud_name: 'dv6xmcbhh',
    api_key: '145468228265349',
    api_secret: '-zhEa_Mu7kjQh0zP2jKI2w6GtEE',
   
});

const url = cloudinary.url('cld-sample-4',{ transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }] });



// File upload setup with multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use(express.static('uploads'));

// Route for uploading photos
app.post('/upload', upload.single('photo'), async (req, res) => {
  const { filename, path } = req.file;
  const result = await cloudinary.uploader.upload(path);  //upload photo to cloudinary
  const url = cloudinary.url(result.public_id,{ transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }] });  //get url from cloudinary
 
  const newPhoto = await prisma.photo.create({
    data: {
      filename,
      filepath: path,
      url

    }
  });
  res.redirect('/');
});

app.delete('/delete-item', async (req, res) => {
  const itemId = req.body.itemId;
  console.log(itemId)
  return "deleted"
  await prisma.photo.delete({
    where: {
      id
    }
  });
  res.redirect('/');
});

// SSR: Route to render HTML with photo display
app.get('/', async (req, res) => {
  const photos = await prisma.photo.findMany();
  let photoGallery = photos.map(photo => `
    <div style="margin: 10px; text-align: center;">
      <form action="/delete" method="POST">
  <input type="hidden" name="_method" value="DELETE" />
  <input type="hidden" name="itemId" value=${photo.id}/>
  
  <button type="submit">Delete Item</button>
</form>
      <img src="${photo.url}" alt="${photo.filename}" style="width: 200px; height: auto;" />
      <p>${photo.filename}</p>
    </div>
  `).join('');

  const html = `
    <html>
      <head><title>Photo Gallery</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1 style="text-align: center;">Photo Gallery</h1>
        <form action="/upload" method="post" enctype="multipart/form-data" style="text-align: center;">
          <input type="file" name="photo" required>
          <button type="submit" style="margin-top: 10px;">Upload Photo</button>
        </form>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; margin-top: 20px;">
          ${photoGallery}
        </div>
      </body>
    </html>
  `;
  res.send(html);
});

app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
