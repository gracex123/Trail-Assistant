import { useState, useEffect } from "react";
import { useAuthToken } from "../AuthTokenContext";

export default function useWishes() {
  const [wishItems, setWishItems] = useState([]);
  const { accessToken } = useAuthToken();

  useEffect(() => {
    async function getWishItemsFromApi() {
      const data = await fetch(`${process.env.REACT_APP_API_URL}/wishitems`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const wishItems = await data.json();

      setWishItems(wishItems);
    }

    if (accessToken) {
      getWishItemsFromApi();
    }
  }, [accessToken]);

  return [wishItems, setWishItems];
}
