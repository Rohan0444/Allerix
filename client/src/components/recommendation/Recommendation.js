import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@mui/material';

import Navbar from '../navbar/Navbar';
import './recommendation.css';
import boy from "../../assets/images/boy.svg";
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import { useNavigate } from "react-router-dom";
import { getRecommendationAPIMethod, updateQuestionAPIMethod } from "../../api/question";
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import Loader from '../loader/Loader';

import PdfEmbed from '../PdfEmbed';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
).toString();

const Recommendation = () => {
    const [recommendation, setRecommendation] = useState(null);
    const [recList, setRecList] = useState([]); // top 10 recommendation
    const { questionId, age, description, allergies } = useParams();
    const navigate = useNavigate();

    function truncateText(text, limit) {
        if (text.length > limit) {
            return text.substring(0, limit) + '...';
        }
        return text;
    }

    function convertToNewUrl(originalUrl) {
        const prefix = 'https://dsld.od.nih.gov/label/';
        const suffix = '.pdf';
        const id = originalUrl.substring(prefix.length);

        return `https://api.ods.od.nih.gov/dsld/s3/pdf/${id}${suffix}`;
    }

    useEffect(() => {
        getRecommendationAPIMethod(age, description, allergies)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                setRecommendation(data);
                if (data && Array.isArray(data.results)) {
                    setRecList(data.results.slice(0, 10));
                }
            })
            .catch(err => {
                console.error("Failed to fetch recommendations:", err);
            });
    }, [age, description, allergies]);

    const handleUpdateQuestion = () => {
        const rec_list = { rec_list: recList };
        updateQuestionAPIMethod(questionId, rec_list)
            .then(response => {
                if (response.ok) {
                    console.log("Recommendation record has been saved.");
                } else {
                    console.log("Error saving recommendation.");
                }
            })
            .catch(err => {
                console.error("Error when saving recommendation:", err);
            });
    }

    return (
        <div className='recommendation'>
            <Navbar />
            <div className='to_mainpage' onClick={() => { handleUpdateQuestion(); navigate('/mainpage'); }}>
                <KeyboardBackspaceIcon />
                <div>Save & Exit</div>
            </div>
            <div className='recommendation_outer'>
                {recList.length === 0 && (
                    <>
                        <h1 className='loading_title'>Collecting results...</h1>
                        <p className='loading_subtext'>(This may take up to 10 seconds)</p>
                        <Loader />
                    </>
                )}
                {recList.length !== 0 && (
                    <>
                        <h1>Recommendations ({recList.length})</h1>
                        <div className='recommendation_container'>
                            {recList.map((d, idx) => (
                                <div className='recommendation_inner' key={idx}>
                                    <div className='recommendation_object'>
                                        <PdfEmbed url={convertToNewUrl(d.URL)} width="100%" height="100%" />
                                    </div>
                                    <div className='recommendation_object_bottom'>
                                        <h3>{d["Product Name"]}</h3>
                                        <div className='recommendation_object_bottom_bottom'>
                                            <p className='maker'>By {d["Brand Name"]}</p>
                                            <div className='hover_over'>
                                                Hover over me!
                                            </div>
                                            <div className='hidden_div'>
                                                {d.Statement}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Recommendation;
