import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { MAX_WORKING_DAYS_FOR_DUE_DATE } from '../constants/config';

const marquee = keyframes`
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
`;

const MarqueeContainer = styled(Box)`
  width: 100%;
  overflow: hidden;
  background-color: #fff4e5; /* Warning light orange */
  border-bottom: 1px solid #ffcc80;
  padding: 8px 0;
  white-space: nowrap;
`;

const MarqueeContent = styled(Box)`
  display: inline-block;
  animation: ${marquee} 20s linear infinite;
  padding-left: 100%; /* Start from right */
`;

const calculateDueDate = () => {
    const today = new Date();
    // Get 1st day of next month
    let nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    let workingDays = 0;
    while (workingDays < MAX_WORKING_DAYS_FOR_DUE_DATE) {
        const dayOfWeek = nextMonth.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++;
        }
        if (workingDays < MAX_WORKING_DAYS_FOR_DUE_DATE) {
            nextMonth.setDate(nextMonth.getDate() + 1);
        }
    }
    return nextMonth;
};

const UnsettledAmountNotification = ({ amount }) => {
    // Only show if amount is strictly positive
    if (!amount || amount <= 0) {
        return null;
    }

    const dueDate = useMemo(() => calculateDueDate(), []);

    return (
        <MarqueeContainer>
            <MarqueeContent>
                <Typography variant="body1" component="span" sx={{ fontWeight: 'bold', color: '#e65100' }}>
                    You have an unsettled amount of ₹{parseFloat(amount).toFixed(2)} which is due on {dueDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
                </Typography>
            </MarqueeContent>
        </MarqueeContainer>
    );
};

export default UnsettledAmountNotification;
