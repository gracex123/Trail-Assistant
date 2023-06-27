import "../style/wishlist.css";
import { Link } from "react-router-dom";
import { useState } from "react";
import useWishes from "../hooks/useWishes";
import { useAuthToken } from "../AuthTokenContext";
import { useAuth0 } from "@auth0/auth0-react";


export default function Wishlist() {
  const {user} = useAuth0();
  const {auth0Id}= user.sub;
  const [newMemo, setNewMemo] = useState("");
  const [wishItems, setWishItems] = useWishes();
  const { accessToken } = useAuthToken();
  const [isMemoOpen, setIsMemoOpen] = useState([]);


  async function insertMemo(id, memo) {
    const data = await fetch(`${process.env.REACT_APP_API_URL}/wishitems/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        memo: memo
      }),
    });
    if (data.ok) {
      const wishItem = await data.json();
      return wishItem;
    } else {
      return null;
    }
  }

  async function deleteWishItem(id) {
    const data = await fetch(`${process.env.REACT_APP_API_URL}/wishitems/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (data.ok) {
      const deletedItem = await data.json();
      return deletedItem;
    } else {
      return null;
    }
  }

  const openMemoWindow = (e) => {
    let id = e.target.value;
    setIsMemoOpen([...isMemoOpen, id]);

  };

  const closeMemoWindow = (e) => {
    let id = e.currentTarget.value;
    setIsMemoOpen(isMemoOpen.filter((i) => ((i !== id))));
    setNewMemo("");
  };

  const handleMemoSubmit = async (e) => {
    e.preventDefault();

    if (!newMemo) return;
    const id = e.currentTarget.value;

    const newWishItem = await insertMemo(id, newMemo);

    if (newWishItem) {

        setWishItems((prev) => {
          const newArr = prev.filter((p) => {
            return p.trailId !== id;
          });
          return [...newArr, newWishItem];
        });
        setIsMemoOpen(isMemoOpen.filter((i) => ((i !== id))))
        
    };

  };
  
  const handleDeleteWishItem = async (e) => {
    e.preventDefault();

    const id = e.target.value;
    const deletedItem = await deleteWishItem(id);
    if (deletedItem) {
      setWishItems(wishItems.filter((i) => ((i.trailId !== id) && (i.authorId !== auth0Id))));
    }

  }

  return (
    <div className="wish-list">
      <ul className="list">
        {wishItems.map((item) => {
          return (
            <li key={item.id} className="wish-item" value={item.trailId}>
              <Link to = {`/trails/${item.trailId}`} > 
                <span className="wishName">Detail</span>
              </Link> 
              <button aria-label={`AddMemo`} value={item.trailId} onClick={openMemoWindow} className="addMemoButton">
                Add Memo
              </button>
              <button aria-label={`Remove`} value={item.trailId} onClick={handleDeleteWishItem} className="removeButton">
                X
              </button>
              {isMemoOpen.includes(item.trailId) && (
                <div>
                  <textarea value={item.memo} onChange={(e) => setNewMemo(e.target.value)} />
                  <button value={item.trailId} onClick={(e) => handleMemoSubmit(e)} className="saveButton">Save Memo</button>
                  <button value={item.trailId} onClick={closeMemoWindow} className="cancelButton">Cancel</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

    </div>
  );
}
