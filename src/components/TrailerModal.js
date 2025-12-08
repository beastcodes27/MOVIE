import React, { useEffect } from 'react';
import './TrailerModal.css';

const TrailerModal = ({ trailerUrl, movieName, isOpen, onClose }) => {
  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !trailerUrl) return null;

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    // Handle different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    }
    
    // If not a YouTube URL, return original
    return url;
  };

  const embedUrl = getYouTubeEmbedUrl(trailerUrl);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="trailer-modal-overlay" onClick={handleOverlayClick}>
      <div className="trailer-modal" onClick={(e) => e.stopPropagation()}>
        <button className="trailer-modal-close" onClick={onClose} aria-label="Close trailer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="trailer-modal-header">
          <h2 className="trailer-modal-title">{movieName}</h2>
          <p className="trailer-modal-subtitle">Watch Trailer</p>
        </div>

        <div className="trailer-modal-content">
          {embedUrl.includes('youtube.com/embed') || embedUrl.includes('youtu.be') || embedUrl.includes('youtube.com/watch') ? (
            <div className="trailer-video-wrapper">
              <iframe
                src={embedUrl}
                title={`${movieName} Trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="trailer-video"
              ></iframe>
            </div>
          ) : (
            <div className="trailer-error">
              <p>Unable to load trailer. Please check the trailer URL.</p>
              <a 
                href={trailerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="trailer-external-link"
              >
                Open in new tab
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;








