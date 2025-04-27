import * as React from "react";
import { useEffect, useState } from "react";
import "@pnp/sp/webs";
import "@pnp/sp/lists/web";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { getSP } from "../../../pnpConfigFile";
import styles from "./OrderList.module.scss";

export interface OrderListProps {
  bookingListName: string;
  currentUser: {
    email: string;
    displayName: string;
  };
}

export interface OrderItem {
  Id: number;
  Title: string;
  Quantity: number;
  Status: string;
  OrderId: string;
  BookingTime: string;
  UserEmail: {
    Title: string;
  };
}

interface GroupedOrder {
  orderId: string;
  bookingTime: string;
  userName: string;
  items: OrderItem[];
}

const OrderList: React.FC<OrderListProps> = ({ bookingListName, currentUser }) => {
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatedStatuses, setUpdatedStatuses] = useState<{ [key: number]: string }>({});
  const sp = getSP();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const items = await sp.web.lists
        .getByTitle(bookingListName)
        .items.select(
          "Id",
          "OrderId",
          "Title",
          "Quantity",
          "Status",
          "BookingTime",
          "UserEmail/Title"
        )
        .expand("UserEmail")
        .top(100)();

      // Sort by booking time descending
      const sortedItems = items.sort((a, b) => new Date(b.BookingTime).getTime() - new Date(a.BookingTime).getTime());

      // Group by OrderId
      const grouped: { [orderId: string]: GroupedOrder } = {};

      sortedItems.forEach(item => {
        if (!grouped[item.OrderId]) {
          grouped[item.OrderId] = {
            orderId: item.OrderId,
            bookingTime: item.BookingTime,
            userName: item.UserEmail?.Title || "Unknown",
            items: []
          };
        }
        grouped[item.OrderId].items.push(item);
      });

      setGroupedOrders(Object.keys(grouped).map(key => grouped[key]));

    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setErrorMessage("Error loading orders. Please check your access.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (itemId: number, newStatus: string) => {
    setUpdatedStatuses((prev) => ({
      ...prev,
      [itemId]: newStatus,
    }));
  };

  const handleUpdateStatus = async (itemId: number) => {
    const newStatus = updatedStatuses[itemId];
    if (!newStatus) return;

    try {
      await sp.web.lists.getByTitle(bookingListName).items.getById(itemId).update({
        Status: newStatus,
      });

      fetchOrders(); // Refresh entire list after update
      setErrorMessage(null);
      alert(`✅ Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      setErrorMessage("Error updating the status.");
    }
  };

  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case "booked":
        return styles.booked;
      case "ready":
        return styles.ready;
      case "served":
        return styles.served;
      case "cancelled":
        return styles.cancelled;
      default:
        return styles.default;
    }
  };

  return (
    <div className={styles.container}>
      <h2>🍽️ Order Management Dashboard</h2>
      <p>Welcome, <strong>{currentUser.displayName}</strong></p>

      {isLoading && <p>Loading orders...</p>}
      {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
      {!isLoading && groupedOrders.length === 0 && <p>No orders found.</p>}

      <div className={styles.orderList}>
        {groupedOrders.map((group) => (
          <div key={group.orderId} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <span className={styles.orderId}>#{group.orderId}</span>
              <span><strong>User:</strong> {group.userName}</span>
              <span><strong>Date:</strong> {new Date(group.bookingTime).toLocaleDateString()}</span>
            </div>

            <div className={styles.orderItems}>
              {group.items.map((item) => (
                <div key={item.Id} className={styles.orderItemRow}>
                  <div className={styles.foodItem}>
                    <strong>{item.Title}</strong> (Qty: {item.Quantity})
                  </div>
                  <div className={styles.itemActions}>
                    <span className={`${styles.statusBadge} ${getStatusClass(item.Status)}`}>
                      {item.Status}
                    </span>
                    <select
                      value={updatedStatuses[item.Id] || item.Status}
                      onChange={(e) => handleStatusChange(item.Id, e.target.value)}
                    >
                      <option value="Booked">Booked</option>
                      <option value="Ready">Ready</option>
                      <option value="Served">Served</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <button
                      className={styles.button}
                      onClick={() => handleUpdateStatus(item.Id)}
                    >
                      Update
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderList;
