import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    Alert,
    styled,
    Theme
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const ConfidenceBar = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
    '& .MuiLinearProgress-bar': {
        transition: 'transform 1s ease-in-out',
    },
}));

const ResultCard = styled(Card)(({ theme }: { theme: Theme }) => ({
    borderRadius: `${Number(theme.shape.borderRadius) * 2}px`,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
    },
}));

interface PredictionResultProps {
    result: {
        car_model: string;
        confidence: number;
        success: boolean;
        error?: string;
        details?: string;
    } | null;
}

const PredictionResult: React.FC<PredictionResultProps> = ({ result }) => {
    if (!result) return null;

    if (!result.success) {
        return (
            <Alert
                severity="error"
                icon={<ErrorIcon fontSize="large" />}
                sx={{ 
                    mt: 2,
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                        fontSize: '2rem'
                    }
                }}
            >
                {result.error || 'Failed to process image'}
                {result.details && (
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                        Details: {result.details}
                    </Typography>
                )}
            </Alert>
        );
    }

    return (
        <ResultCard elevation={3} sx={{ mt: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircleIcon 
                        color="success" 
                        sx={{ 
                            mr: 1,
                            fontSize: '2rem',
                            animation: 'pulse 1.5s infinite',
                            '@keyframes pulse': {
                                '0%': {
                                    transform: 'scale(1)',
                                },
                                '50%': {
                                    transform: 'scale(1.1)',
                                },
                                '100%': {
                                    transform: 'scale(1)',
                                },
                            },
                        }} 
                    />
                    <Typography variant="h6" component="div">
                        Prediction Result
                    </Typography>
                </Box>

                <Typography 
                    variant="h5" 
                    color="primary" 
                    gutterBottom
                    sx={{
                        fontWeight: 600,
                        textAlign: 'center',
                        mb: 2
                    }}
                >
                    {result.car_model}
                </Typography>

                <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                            Confidence
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color={result.confidence > 70 ? "success.main" : "warning.main"}>
                            {(result.confidence)}%
                        </Typography>
                    </Box>
                    <ConfidenceBar
                        variant="determinate"
                        value={result.confidence}
                        color={result.confidence > 70 ? "success" : "warning"}
                    />
                </Box>
            </CardContent>
        </ResultCard>
    );
};

export default PredictionResult; 