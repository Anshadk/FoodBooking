import * as React from "react";
import { useEffect, useState } from "react";
import { IOrderHistoryProps } from "./IOrderHistoryProps";
import "@pnp/sp/webs";
import "@pnp/sp/lists/web";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { getSP } from "../../../pnpConfigFile";
import styles from "./OrderHistory.module.scss";

export interface OrderItem {
  Id: number;
  Title: string;
  Quantity: number;
  Status: string;
  OrderId: string;
  BookingTime: string;
}

const OrderHistory: React.FC<IOrderHistoryProps> = (props) => {
  const { description, userDisplayName,  bookingList, currentUser } = props;

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sp = getSP();

  useEffect(() => {
    fetchMyOrders();
  }, [bookingList, currentUser.email]);

  const fetchMyOrders = async () => {
    setIsLoading(true);
    try {
      const items = await sp.web.lists
        .getByTitle(bookingList)
        .items
        .select("Id", "OrderId", "Title", "Quantity", "Status", "BookingTime", "UserEmail/Title", "UserEmail/EMail")
        .expand("UserEmail")
        .filter(`UserEmail/EMail eq '${currentUser.email}'`)
        .top(50)();
  
      const myOrders: OrderItem[] = items.map((item) => ({
        Id: item.Id,
        Title: item.Title,
        Quantity: item.Quantity,
        Status: item.Status,
        OrderId: item.OrderId,
        BookingTime: item.BookingTime,
      }));
  
      // Sort the orders by BookingTime in descending order
      myOrders.sort((a, b) => {
        const dateA = new Date(a.BookingTime);
        const dateB = new Date(b.BookingTime);
        return dateB.getTime() - dateA.getTime(); // Descending order
      });
  
      setOrders(myOrders);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Failed to fetch orders:", err.message);
      setErrorMessage("Error loading your orders. Please try again later.");
    } finally {
      setIsLoading(false);
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
    <div className={styles.orderHistory}>
      <h1>📋 Order History</h1>
      <p>{description}</p>

      <p>Welcome, <strong>{userDisplayName}</strong>! 👋</p>

      <hr className={styles.divider} />

      {isLoading && <p>Loading your orders...</p>}
      {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
      {!isLoading && orders.length === 0 && <p>No orders found.</p>}

      {orders.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.th}>Order ID</th>
              <th className={styles.th}>Food Item</th>
              <th className={styles.th}>Qty</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Booking Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.Id}>
                <td className={styles.td}>{order.OrderId}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrderHistory;
