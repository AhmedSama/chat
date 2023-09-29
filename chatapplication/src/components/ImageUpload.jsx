import { useState } from 'react';
import axiosInstance from '../axiosConfig';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const ImageUpload = ({socket,roomID}) => {
  const [image, setImage] = useState(null);
  const [progress, setProgress] = useState(0);
  const userData = useSelector(state => state.user.userData)

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    if (selectedImage && selectedImage.type.startsWith('image/')) {
      setImage(selectedImage);
    } else {
      // Handle invalid file type (non-image)
      toast.error('Please select a valid image file.');
    }
  };

  const handleUpload = () => {
    if (!image) {
      toast.error('Please select an image to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);

    axiosInstance.post('/upload', formData, {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setProgress(percentCompleted);
      },
    })
      .then((response) => {
        // Handle the server response
        console.log('Image uploaded successfully', response.data);
        const myID = userData.id
        const name = userData.displayName
        const photoURL = userData.photoURL
        socket.emit("send msg",response.data.imageUrl,roomID,myID,name,photoURL,"image")
      })
      .catch((error) => {
        // Handle errors
        console.error('Error uploading image', error);
      });
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <button onClick={handleUpload}>Upload Image</button>
      {progress > 0 && <p>Uploading: {progress}%</p>}
    </div>
  );
};

export default ImageUpload;
