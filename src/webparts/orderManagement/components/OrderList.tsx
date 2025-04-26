import * as React from "react";
import { useEffect, useState } from "react";
import "@pnp/sp/webs";
import "@pnp/sp/lists/web";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { getSP } from "../../../pnpConfigFile";
import styles from "./OrderList.module.scss"; // Import SCSS module

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

const OrderList: React.FC<OrderListProps> = ({ bookingListName, currentUser }) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
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
      setOrders(items);
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

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.Id === itemId ? { ...order, Status: newStatus } : order
        )
      );

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
      {!isLoading && orders.length === 0 && <p>No orders found.</p>}

      {orders.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.th}>Order ID</th>
              <th className={styles.th}>User</th>
              <th className={styles.th}>Food Item</th>
              <th className={styles.th}>Qty</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Booking Date</th>
              <th className={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.Id}>
                <td className={styles.td}>{order.OrderId}</td>
                <td className={styles.td}>{order.UserEmail?.Title || "Unknown"}</td>
                <td className={styles.td}>{order.Title}</td>
                <td className={styles.td}>{order.Quantity}</td>
                <td className={styles.td}>
                  <span className={`${styles.statusBadge} ${getStatusClass(order.Status)}`}>
                    {order.Status}
                  </span>
                </td>
                <td className={styles.td}>
                  {order.BookingTime ? new Date(order.BookingTime).toLocaleDateString() : "N/A"}
                </td>
                <td className={styles.td}>
                  <select
                    value={updatedStatuses[order.Id] || order.Status}
                    onChange={(e) => handleStatusChange(order.Id, e.target.value)}
                  >
                    <option value="Booked">Booked</option>
                    <option value="Ready">Ready</option>
                    <option value="Served">Served</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <button
                    className={styles.button}
                    onClick={() => handleUpdateStatus(order.Id)}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrderList;