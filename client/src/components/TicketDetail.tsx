import React from "react";
import { RequesterTicketDetail } from "../pages/RequesterTicketDetail";

interface TicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = (props) => {
  return <RequesterTicketDetail {...props} />;
};

export default TicketDetail;
