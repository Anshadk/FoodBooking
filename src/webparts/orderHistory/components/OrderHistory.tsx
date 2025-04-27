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
  const {
    description,
    userDisplayName,
    bookingList,
    currentUser
  } = props;

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
        
      // Sort orders in descending booking time
      const sortedOrders = items.sort((a, b) => {
        return new Date(b.BookingTime).getTime() - new Date(a.BookingTime).getTime();
      });

      const myOrders: OrderItem[] = sortedOrders.map((item) => ({
        Id: item.Id,
        Title: item.Title,
        Quantity: item.Quantity,
        Status: item.Status,
        OrderId: item.OrderId,
        BookingTime: item.BookingTime,
      }));

      setOrders(myOrders);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Failed to fetch orders:", err.message);
      setErrorMessage("Error loading your orders. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Group orders by OrderId
  const groupedOrders = orders.reduce((acc, order) => {
    if (!acc[order.OrderId]) {
      acc[order.OrderId] = [];
    }
    acc[order.OrderId].push(order);
    return acc;
  }, {} as { [key: string]: OrderItem[] });

  // Get dynamic color for status
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

      {Object.keys(groupedOrders).map(orderId => (
        <div key={orderId} className={styles.orderGroup}>
          <h3>🛒 Order ID: {orderId}</h3>
          {groupedOrders[orderId].map(order => (
            <div key={order.Id} className={styles.orderCard}>
              <div><strong>Food Item:</strong> {order.Title}</div>
              <div><strong>Quantity:</strong> {order.Quantity}</div>
              <div>
                <strong>Status:</strong> 
                <span className={`${styles.statusBadge} ${getStatusClass(order.Status)}`}>
                  {order.Status}
                </span>
              </div>
              <div><strong>Booking Date:</strong> {order.BookingTime ? new Date(order.BookingTime).toLocaleDateString() : "N/A"}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default OrderHistory;
