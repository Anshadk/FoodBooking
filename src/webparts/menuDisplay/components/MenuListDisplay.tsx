import * as React from "react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Importing uuid for unique orderId generation
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
  const sp = getSP();

  const fetchItems = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const listItems: ListItem[] = await sp.web.lists
        .getByTitle(listName)
        .items.select("Id", "Title", "Price", "Category", "FoodType")();
      const validItems = listItems.filter(item => item.Price > 0);
      setItems(validItems);
    } catch (error) {
      setErrorMessage("Failed to fetch items. Please check the list name or your permissions.");
      console.error("Fetch Items Error: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectItem = (item: ListItem) => {
    setSuccessMessage(null); // clear success msg on selection
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
    setSuccessMessage(null); // clear success msg on removal
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

    const orderId = uuidv4(); // Generate a unique orderId
    setIsOrdering(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const userEmail = typeof currentUser === 'string' ? currentUser : currentUser.email;

      // ✅ Resolve user ID from email
      const spUser = await sp.web.siteUsers.getByEmail(userEmail)();
      const userId = spUser.Id;

      const bookingPromises = selectedItems.map(async (item) => {
        return await sp.web.lists.getByTitle(bookingListName).items.add({
          Title: item.Title,
          FoodItemId: item.Id,            // assuming this is a Number column, not a Lookup
          Quantity: Number(item.quantity),
          Status: "Booked",
          UserEmailId: userId,           // ✅ Person field reference by ID
          OrderId: orderId,              // Adding unique Order ID to the booking
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

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>
        Welcome, {typeof currentUser === 'string' ? currentUser : currentUser.displayName || 'Guest'}!
      </h1>
      <h2 className={styles.menuTitle}>🍴 Today's Menu</h2>

      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}

      {successMessage && (
        <div className={styles.successMessage}>{successMessage}</div>
      )}

      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeader}>
            <th className={styles.tableHeaderCell}>Dish Name</th>
            <th className={styles.tableHeaderCell}>Category</th>
            <th className={styles.tableHeaderCell}>Type</th>
            <th className={styles.tableHeaderCell}>Price</th>
            <th className={styles.tableHeaderCell}>Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={5} className={styles.tableData}>Loading menu...</td></tr>
          ) : items.length > 0 ? (
            items.map((item) => (
              <tr key={item.Id} className={styles.tableRow}>
                <td className={styles.tableData}>{item.Title}</td>
                <td className={styles.tableData}>{item.Category}</td>
                <td className={styles.tableData}>{item.FoodType}</td>
                <td className={styles.tableData}>{`₹ ${item.Price.toFixed(2)}`}</td>
                <td className={styles.tableData}>
                  <button 
                    type="button"
                    aria-label={`Add ${item.Title} to cart`}
                    onClick={() => handleSelectItem(item)}
                    className={styles.addButton}
                  >
                    Add
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className={styles.tableData}>No menu items available today.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Selected Items Section */}
      {selectedItems.length > 0 && (
        <div className={styles.orderSummary}>
          <h3 style={{ marginBottom: "20px" }}>Your Order</h3>
          <table className={styles.orderTable}>
            <thead>
              <tr className={styles.orderTableHeader}>
                <th className={styles.orderTableCell}>Item</th>
                <th className={styles.orderTableCell}>Quantity</th>
                <th className={styles.orderTableCell}>Price</th>
                <th className={styles.orderTableCell}>Subtotal</th>
                <th className={styles.orderTableCell}>Action</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((item) => (
                <tr key={item.Id} className={styles.tableRow}>
                  <td className={styles.tableData}>{item.Title}</td>
                  <td className={styles.tableData}>{item.quantity}</td>
                  <td className={styles.tableData}>{`₹ ${item.Price.toFixed(2)}`}</td>
                  <td className={styles.tableData}>{`₹ ${(item.Price * item.quantity).toFixed(2)}`}</td>
                  <td className={styles.tableData}>
                    <button 
                      type="button"
                      aria-label={`Remove ${item.Title}`}
                      onClick={() => handleRemoveItem(item.Id)}
                      className={`${styles.removeButton} ${styles.addButton}`}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.totalPrice}>
            Total: ₹ {selectedItems.reduce((total, item) => total + item.Price * item.quantity, 0).toFixed(2)}
          </div>

          <div className={styles.placeOrderButton}>
            <button 
              type="button"
              onClick={placeOrder}
              disabled={isOrdering}
              className={isOrdering ? styles.placeOrderButtonDisabled : styles.placeOrderButtonDisabled}
            >
              {isOrdering ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuListDisplay;
