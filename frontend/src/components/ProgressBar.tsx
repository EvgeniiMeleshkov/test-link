interface Props {
  processed: number;
  total: number;
}

export function ProgressBar({ processed, total }: Props) {
  const percent = total === 0 ? 0 : Math.round((processed / total) * 100);

  return (
    <div className="progress">
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="progress__label">
        {processed} из {total} обработано ({percent}%)
      </span>
    </div>
  );
}
