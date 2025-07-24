import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Grid,
    styled,
    Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
    DirectionsCar,
    Speed,
    Straighten,
    Security,
    Devices,
    Weekend,
    Palette,
    LocalGasStation,
    AttachMoney,
    Brush
} from '@mui/icons-material';

const FeatureCard = styled(Card)(({ theme }) => ({
    marginTop: theme.spacing(2),
    borderRadius: `calc(${theme.shape.borderRadius} * 2)`,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
    },
}));

const FeatureAccordion = styled(Accordion)(({ theme }) => ({
    '&:before': {
        display: 'none',
    },
    borderRadius: '8px !important',
    margin: '8px 0',
    boxShadow: 'none',
    border: `1px solid ${theme.palette.divider}`,
    '&:first-of-type': {
        borderRadius: '8px !important',
    },
    '&:last-of-type': {
        borderRadius: '8px !important',
    },
}));

export interface CarFeaturesData {
    model: string;
    engine: {
        type: string;
        horsepower: string;
        torque: string;
    };
    performance: {
        acceleration: string;
        topSpeed: string;
        drivetrain: string;
    };
    dimensions: {
        length: string;
        width: string;
        height: string;
        weight: string;
    };
    safety: string[];
    technology: string[];
    interior: string[];
    exterior: string[];
    fuelEconomy: {
        city: string;
        highway: string;
        combined: string;
    };
    priceRange: {
        base: string;
        highEnd: string;
    };
    colors: string[];
    yearIntroduced?: string;
    vehicleType?: string;
}

interface CarFeaturesProps {
    features: CarFeaturesData;
}

const featureSections = [
    { key: 'engine', title: 'Engine', icon: DirectionsCar },
    { key: 'performance', title: 'Performance', icon: Speed },
    { key: 'dimensions', title: 'Dimensions', icon: Straighten },
    { key: 'safety', title: 'Safety', icon: Security },
    { key: 'technology', title: 'Technology', icon: Devices },
    { key: 'interior', title: 'Interior', icon: Weekend },
    { key: 'exterior', title: 'Exterior', icon: Palette },
    { key: 'fuelEconomy', title: 'Fuel Economy', icon: LocalGasStation },
    { key: 'priceRange', title: 'Price Range', icon: AttachMoney },
    { key: 'colors', title: 'Colors', icon: Brush }
];

const CarFeatures: React.FC<CarFeaturesProps> = ({ features }) => {
    const renderFeatureContent = (key: string, data: any) => {
        if (Array.isArray(data)) {
            return (
                <Grid container spacing={1}>
                    {data.map((item, index) => (
                        <Grid size={{ xs: 6 }} key={index}>
                            <Chip 
                                label={item} 
                                variant="outlined" 
                                size="small"
                                sx={{ 
                                    borderRadius: 2,
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            />
                        </Grid>
                    ))}
                </Grid>
            );
        }

        if (typeof data === 'object' && data !== null) {
            return (
                <Grid container spacing={2}>
                    {Object.entries(data).map(([subKey, value]) => (
                        <Grid size={{ xs: 6 }} key={subKey}>
                            <Typography variant="body2" color="textSecondary">
                                {subKey.split(/(?=[A-Z])/).join(' ')}:
                            </Typography>
                            <Typography variant="body1">
                                {value as string}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
            );
        }

        return (
            <Typography variant="body1">
                {data}
            </Typography>
        );
    };

    return (
        <FeatureCard>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {features.model} Features & Specifications
                </Typography>

                <Box sx={{ mt: 2 }}>
                    {featureSections.map(({ key, title, icon: Icon }) => (
                        <FeatureAccordion key={key}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.02)'
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Icon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography>{title}</Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                {renderFeatureContent(key, features[key as keyof typeof features])}
                            </AccordionDetails>
                        </FeatureAccordion>
                    ))}
                </Box>

                {/* "More About This Car" Button */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        endIcon={<OpenInNewIcon />}
                        onClick={() => {
                            const searchQuery = encodeURIComponent(`${features.model} car specifications`);
                            window.open(
                                `https://www.google.com/search?q=${searchQuery}`,
                                '_blank',
                                'noopener,noreferrer'
                            );
                        }}
                        sx={{
                            px: 4,
                            py: 1,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'medium',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                                transform: 'translateY(-1px)'
                            }
                        }}
                    >
                        More About This Car
                    </Button>
                </Box>
            </CardContent>
        </FeatureCard>
    );
};

export default CarFeatures;