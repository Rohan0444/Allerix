// src/components/PdfEmbed.jsx
import React, { useState, useEffect } from 'react';
import Loader from './loader/Loader';

export default function PdfEmbed({ url, width = '100%', height = '500px' }) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // get the numeric id
    const id = url
      .replace('https://api.ods.od.nih.gov/dsld/s3/pdf/', '')
      .replace('.pdf', '');

    // FULL absolute URL to your Express proxy:
    const proxyUrl = `http://localhost:3001/pdf-proxy?id=${id}`;

    fetch(proxyUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        if (!cancelled) setBlobUrl(URL.createObjectURL(blob));
      })
      .catch(err => console.error("PDF fetch error:", err));

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [url]);

  if (!blobUrl) return <Loader />;
  return <embed className="pdf-embed" src={blobUrl} type="application/pdf" />
}
