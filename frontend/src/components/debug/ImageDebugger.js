import React, { useState, useEffect } from 'react';
import { checkImageUrl } from '../../utils/debug';
import { formatImageUrl } from '../../utils/imageUtils';

const ImageDebugger = ({ imageUrl }) => {
  const [urls, setUrls] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const generateUrls = () => {
      if (!imageUrl) return [];
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const trimmedUrl = imageUrl.trim();
      
      // Tạo danh sách các URL có thể
      const possibleUrls = [
        // URL gốc
        trimmedUrl,
        
        // URL với API
        `${apiUrl}/api/uploads/${trimmedUrl.replace('uploads/', '')}`,
        `${apiUrl}/uploads/${trimmedUrl.replace('uploads/', '')}`,
        
        // URL tương đối
        `/api/uploads/${trimmedUrl.replace('uploads/', '')}`,
        `/uploads/${trimmedUrl.replace('uploads/', '')}`,
        
        // URL được format
        formatImageUrl(trimmedUrl)
      ];
      
      // Lọc các URL trùng lặp
      return [...new Set(possibleUrls)];
    };
    
    const checkUrls = async () => {
      setLoading(true);
      const generatedUrls = generateUrls();
      setUrls(generatedUrls);
      
      const checks = {};
      for (const url of generatedUrls) {
        checks[url] = await checkImageUrl(url);
      }
      
      setResults(checks);
      setLoading(false);
    };
    
    checkUrls();
  }, [imageUrl]);
  
  return (
    <div className="card mt-4">
      <div className="card-header">
        <h5>Image Debugger</h5>
      </div>
      <div className="card-body">
        <p><strong>Original URL:</strong> {imageUrl}</p>
        
        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div>
            <h6>URL Tests:</h6>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((url, index) => (
                  <tr key={index}>
                    <td style={{ wordBreak: 'break-all' }}>{url}</td>
                    <td>
                      {results[url] ? (
                        <span className="badge bg-success">Success</span>
                      ) : (
                        <span className="badge bg-danger">Failed</span>
                      )}
                    </td>
                    <td>
                      {results[url] && (
                        <img 
                          src={url} 
                          alt="Preview" 
                          style={{ maxHeight: '50px', maxWidth: '50px' }} 
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="mt-4">
              <h6>Working URLs:</h6>
              <div className="row">
                {urls.filter(url => results[url]).map((url, index) => (
                  <div key={index} className="col-md-4 mb-3">
                    <div className="card">
                      <div className="card-body text-center">
                        <img 
                          src={url} 
                          alt="Preview" 
                          style={{ maxHeight: '100px', maxWidth: '100%' }} 
                        />
                        <div className="mt-2 small text-muted" style={{ wordBreak: 'break-all' }}>
                          {url}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDebugger; 