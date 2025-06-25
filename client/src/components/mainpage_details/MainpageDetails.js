import React, { useEffect, useState } from 'react';
import Navbar from '../navbar/Navbar';
import './mainpagedetails.css';
import { useParams } from 'react-router-dom';
import { getQuestionById } from '../../api/question';
import PdfEmbed from '../PdfEmbed';

const MainpageDetails = () => {
  const { postId } = useParams();
  const [question, setQuestion] = useState(null);

  useEffect(() => {
    getQuestionById(postId)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setQuestion(data))
      .catch(err => console.error("Failed to load question:", err));
  }, [postId]);

  const convertToNewUrl = (originalUrl) => {
    const prefix = 'https://dsld.od.nih.gov/label/';
    const id = originalUrl.substring(prefix.length);
    return `https://api.ods.od.nih.gov/dsld/s3/pdf/${id}.pdf`;
  };

  return (
    <div className='mainpage_details'>
      <Navbar />
      {question && (
        <>
          <div className='mainpage_details_top'>
            <h1>Recommendations ({question.rec_list.length})</h1>
          </div>
          <div className='mainpage_details_container'>
            {question.rec_list.map((item, idx) => (
              <div className='mainpage_details_inner' key={idx}>
                <div className='mainpage_details_object'>
                  <PdfEmbed url={convertToNewUrl(item.URL)} width="100%" height="100%" />
                </div>
                <div className='mainpage_details_object_bottom'>
                  <h3>{item["Product Name"]}</h3>
                  <div className='recommendation_object_bottom_bottom'>
                                            <p className='maker'>By {item["Brand Name"]}</p>
                                            <div className='hover_over'>
                                                Hover over me!
                                            </div>
                                            <div className='hidden_div '>
                                                {item.Statement}
                                            </div>
                                        </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MainpageDetails;
