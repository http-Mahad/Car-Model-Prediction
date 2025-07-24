import React, { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    AppBar,
    Toolbar,
    CssBaseline,
    ThemeProvider,
    createTheme,
    alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import ImageUpload from './components/ImageUpload';
import PredictionResult from './components/PredictionResult';
import CarFeatures, {CarFeaturesData} from './components/CarFeatures';

const theme = createTheme({
    palette: {
        primary: {
            main: '#2563eb', 
            light: '#60a5fa',
            dark: '#1e40af',
        },
        secondary: {
            main: '#db2777', 
            light: '#f472b6',
            dark: '#9d174d',
        },
        background: {
            default: '#f8fafc',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },
        h6: {
            fontWeight: 600,
        },
        body1: {
            fontSize: '1.1rem',
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                },
            },
        },
        MuiContainer: {
            styleOverrides: {
                root: {
                    '@media (min-width: 600px)': {
                        paddingLeft: '32px',
                        paddingRight: '32px',
                    },
                },
            },
        },
    },
});



interface PredictionResult {
    car_model: string;
    confidence: number;
    success: boolean;
    error?: string;
    details?: string;
    features?: CarFeaturesData;
}

function App() {
    const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);

    const handlePredictionComplete = (result: any) => {
        const transformedResult: PredictionResult = {
            car_model: result.car_model || result.carModel || 'Unknown Model',
            confidence: result.confidence,
            success: result.success,
            error: result.error,
            details: result.details,
            features: result.features ? {
                model: result.car_model || result.carModel || 'Unknown Model',
                engine: {
                    type: result.features.engine?.type || result.features.engine_specifications || 'Not specified',
                    horsepower: result.features.engine?.horsepower || 'Not specified',
                    torque: result.features.engine?.torque || 'Not specified'
                },
                performance: {
                    acceleration: result.features.performance?.acceleration || result.features.performance_metrics || 'Not specified',
                    topSpeed: result.features.performance?.topSpeed || 'Not specified',
                    drivetrain: result.features.performance?.drivetrain || 'Not specified'
                },
                dimensions: {
                    length: result.features.dimensions?.length || 'Not specified',
                    width: result.features.dimensions?.width || 'Not specified',
                    height: result.features.dimensions?.height || 'Not specified',
                    weight: result.features.dimensions?.weight || 'Not specified'
                },
                safety: result.features.safety || result.features.safety_features || [],
                technology: result.features.technology || result.features.technology_features || [],
                interior: result.features.interior || result.features.interior_features || [],
                exterior: result.features.exterior || result.features.exterior_features || [],
                fuelEconomy: {
                    city: result.features.fuelEconomy?.city || result.features.fuel_efficiency?.city || 'Not specified',
                    highway: result.features.fuelEconomy?.highway || result.features.fuel_efficiency?.highway || 'Not specified',
                    combined: result.features.fuelEconomy?.combined || result.features.fuel_efficiency?.combined || 'Not specified'
                },
                priceRange: {
                    base: result.features.priceRange?.base || result.features.price_range?.base || 'Not specified',
                    highEnd: result.features.priceRange?.highEnd || result.features.price_range?.highEnd || 'Not specified'
                },
                colors: result.features.colors || result.features.available_colors || [],
                yearIntroduced: result.features.yearIntroduced,
                vehicleType: result.features.vehicleType
            } : undefined
        };
        setPredictionResult(transformedResult);
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut" as const
            }
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ 
                flexGrow: 1, 
                minHeight: '100vh', 
                bgcolor: 'background.default',
                backgroundImage: 'radial-gradient(at 100% 0%, rgb(203 213 225 / 0.15) 0px, transparent 50%)',
            }}>
                <AppBar position="sticky" color="inherit">
                    <Toolbar>
                        <Typography 
                            variant="h6" 
                            component="div" 
                            sx={{ 
                                flexGrow: 1,
                                color: 'primary.main',
                                fontWeight: 700,
                            }}
                        >
                            Car Model Prediction
                        </Typography>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="md" sx={{ mt: 6, pb: 6 }}>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                    >
                        <Box sx={{ 
                            mb: 6, 
                            textAlign: 'center',
                            '& > *': { mb: 2 }
                        }}>
                            <Typography 
                                variant="h4" 
                                component={motion.h1}
                                sx={{
                                    background: 'linear-gradient(45deg, #2563eb 30%, #db2777 90%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Upload a Car Image
                            </Typography>
                            <Typography 
                                variant="body1" 
                                color="text.secondary"
                                sx={{ maxWidth: '600px', mx: 'auto' }}
                            >
                                Our AI will identify the car model and provide detailed specifications
                            </Typography>
                        </Box>

                        <Box sx={{
                            backgroundColor: 'background.paper',
                            borderRadius: 3,
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                            p: 4,
                            mb: 4,
                        }}>
                            <ImageUpload onPredictionComplete={handlePredictionComplete} />
                        </Box>

                        {predictionResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Box sx={{
                                    backgroundColor: 'background.paper',
                                    borderRadius: 3,
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                    p: 4,
                                    mb: 4,
                                }}>
                                    <PredictionResult result={{
                                        car_model: predictionResult?.car_model || '',
                                        confidence: predictionResult?.confidence || 0,
                                        success: predictionResult?.success || false,
                                        error: predictionResult?.error,
                                        details: predictionResult?.details
                                    }} />
                                </Box>
                            </motion.div>
                        )}

                        {predictionResult?.success && predictionResult.features && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <Box sx={{
                                    backgroundColor: 'background.paper',
                                    borderRadius: 3,
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                    p: 4,
                                }}>
                                    <CarFeatures features={predictionResult.features} />
                                </Box>
                            </motion.div>
                        )}

                        {predictionResult?.success && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                            >
                                <Box sx={{ mt: 4, textAlign: 'center' }}>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            color: 'text.secondary',
                                            fontStyle: 'italic'
                                        }}
                                    >
                                        Want to try another image? Just upload a new one!
                                    </Typography>
                                </Box>
                            </motion.div>
                        )}
                    </motion.div>
                </Container>
            </Box>
        </ThemeProvider>
    );
}

export default App;