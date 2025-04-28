import * as React from "react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "@pnp/sp/webs";
import "@pnp/sp/lists/web";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-users/web";
import { getSP } from "../../../pnpConfigFile";
import styles from './MenuListDisplay.module.scss';

interface ListItem {
  Id: number;
  Title: string;
  Price: number;
  Category: string;
  FoodType: string;
  ImageURL?: {
    Url: string;
    Description?: string;
  };
}

interface SelectedItem extends ListItem {
  quantity: number;
}

interface MenuListDisplayProps {
  listName: string;
  bookingListName: string;
  currentUser: string | { email: string; displayName?: string };
}

const MenuListDisplay: React.FC<MenuListDisplayProps> = ({
  listName,
  bookingListName,
  currentUser
}) => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isOrdering, setIsOrdering] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [foodTypeFilter, setFoodTypeFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const sp = getSP();

  const fetchItems = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const listItems: ListItem[] = await sp.web.lists
        .getByTitle(listName)
        .items.select("Id", "Title", "Price", "Category", "FoodType", "ImageURL")();

      const validItems = listItems.filter(item => item.Price > 0);
      setItems(validItems);
    } catch (error) {
      setErrorMessage("Failed to fetch items. Please check the list name or your permissions.");
      console.error("Fetch Items Error: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter(item =>
    (foodTypeFilter === 'All' || item.FoodType === foodTypeFilter) &&
    (categoryFilter === 'All' || item.Category === categoryFilter)
  );

  const handleSelectItem = (item: ListItem) => {
    setSuccessMessage(null);
    setSelectedItems(prevItems => {
      const existingItem = prevItems.find(i => i.Id === item.Id);
      if (existingItem) {
        return prevItems.map(i =>
          i.Id === item.Id ? { ...i, quantity: Number(i.quantity) + 1 } : i
        );
      } else {
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  };

  const handleRemoveItem = (itemId: number) => {
    setSuccessMessage(null);
    setSelectedItems(prevItems => {
      const existingItem = prevItems.find(i => i.Id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevItems.map(i =>
          i.Id === itemId ? { ...i, quantity: Number(i.quantity) - 1 } : i
        );
      } else {
        return prevItems.filter(i => i.Id !== itemId);
      }
    });
  };

  const placeOrder = async () => {
    if (selectedItems.length === 0) {
      setErrorMessage("Please select at least one item to place an order.");
      return;
    }

    const orderId = uuidv4();
    setIsOrdering(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const userEmail = typeof currentUser === 'string' ? currentUser : currentUser.email;
      const spUser = await sp.web.siteUsers.getByEmail(userEmail)();
      const userId = spUser.Id;

      const bookingPromises = selectedItems.map(async (item) => {
        return await sp.web.lists.getByTitle(bookingListName).items.add({
          Title: item.Title,
          FoodItemId: item.Id,
          Quantity: Number(item.quantity),
          Status: "Booked",
          UserEmailId: userId,
          OrderId: orderId,
        });
      });

      await Promise.all(bookingPromises);
      setSuccessMessage(`Order placed successfully! ${selectedItems.length} item(s) booked.`);
      setSelectedItems([]);
    } catch (error) {
      setErrorMessage("Failed to place order. Please try again.");
      console.error("Order Error: ", error);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>
        Welcome, {typeof currentUser === 'string' ? currentUser : currentUser.displayName || 'Guest'}!
      </h1>

      <div className={styles.filters}>
        <select value={foodTypeFilter} onChange={(e) => setFoodTypeFilter(e.target.value)} className={styles.select}>
          <option value="All">All Food Types</option>
          <option value="Veg">Veg</option>
          <option value="Egg">Egg</option>
          <option value="Non-Veg">Non-Veg</option>
        </select>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={styles.select}>
          <option value="All">All Categories</option>
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Snacks">Snacks</option>
          <option value="Dinner">Dinner</option>
        </select>
      </div>

      <h2 className={styles.menuTitle}>🍴 Today's Menu</h2>

      {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
      {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

      <div className={styles.cardContainer}>
        {isLoading ? (
          <p>Loading menu...</p>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item.Id} className={styles.card}>
              {item.ImageURL?.Url && (
                <img 
                  src={item.ImageURL.Url} 
                  alt={item.Title} 
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }} 
                />
              )}
              <div className={styles.cardContent}>
                <h3 className={styles.title}>{item.Title}</h3>
                <p className={styles.details}>{item.Category} | {item.FoodType}</p>
                <p className={styles.price}>₹ {item.Price.toFixed(2)}</p>
                <button
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className={styles.addButton}
                >
                  Add
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No menu items available today.</p>
        )}
      </div>

      {selectedItems.length > 0 && (
        <div className={styles.orderSummary}>
          <h3>Your Order</h3>
          {selectedItems.map(item => (
            <div key={item.Id} className={styles.orderItem}>
              <span>{item.Title} x {item.quantity}</span>
              <span>₹ {(item.Price * item.quantity).toFixed(2)}</span>
              <button
                type="button"
                onClick={() => handleRemoveItem(item.Id)}
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>
          ))}
          <div className={styles.totalPrice}>
            Total: ₹ {selectedItems.reduce((total, item) => total + item.Price * item.quantity, 0).toFixed(2)}
          </div>

          <button
            type="button"
            onClick={placeOrder}
            disabled={isOrdering}
            className={styles.placeOrderButton}
          >
            {isOrdering ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuListDisplay;
