import { UrlCheck } from '../types';
import { formatDuration } from '../utils/format';
import { StatusBadge } from './StatusBadge';

interface Props {
  url: UrlCheck;
}

export function UrlRow({ url }: Props) {
  return (
    <tr>
      <td className="url-cell" title={url.url}>
        {url.url}
      </td>
      <td>
        <StatusBadge status={url.status} />
      </td>
      <td className="center">{url.httpStatus ?? '—'}</td>
      <td className="center">{formatDuration(url.durationMs)}</td>
      <td className="error-cell">{url.error ?? '—'}</td>
    </tr>
  );
}
