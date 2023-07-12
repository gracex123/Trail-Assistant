import { useState, useEffect } from "react";


export default function useImages(detailProps) {
  const [images, setImages] = useState("");


  useEffect(() => {
    const fetchImage = async () => {
      try {
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/images/${detailProps.trailTitle}`, {
          method: "GET",
        });
        const data = await response.json();
        const url = data.url;
        setImages(url);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    if (detailProps.trailTitle) {
      fetchImage(detailProps);
    }

  }, [detailProps]);

  return [images, setImages];
}
