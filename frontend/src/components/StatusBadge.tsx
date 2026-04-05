interface Props { status: string }

const LABEL: Record<string, string> = {
  covered:       "Covered",
  not_covered:   "Not Covered",
  requires_pa:   "Requires PA",
  restricted:    "Restricted",
  investigational: "Investigational",
};

const CLS: Record<string, string> = {
  covered:        "badge badge-green",
  not_covered:    "badge badge-red",
  requires_pa:    "badge badge-amber",
  restricted:     "badge badge-purple",
  investigational:"badge badge-gray",
};

export default function StatusBadge({ status }: Props) {
  return (
    <span className={CLS[status] ?? "badge badge-gray"}>
      <span className={`status-dot ${status}`} />
      {LABEL[status] ?? status}
    </span>
  );
}
