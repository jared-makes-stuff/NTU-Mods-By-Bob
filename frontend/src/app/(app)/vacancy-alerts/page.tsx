import { Metadata } from "next";
import { VacancyAlerts } from "@/features/vacancy-alerts";
import { RoleGate } from "@/shared/components/RoleGate";

export const metadata: Metadata = {
  title: "Vacancy Alerts",
  description: "Track module vacancy alerts and Telegram notifications.",
};

export default function VacancyAlertsPage() {
  return (
    <RoleGate minRole="plus" message="Plus access is required to use vacancy alerts.">
      <VacancyAlerts />
    </RoleGate>
  );
}
