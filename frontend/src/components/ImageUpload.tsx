import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Typography,
    styled,
    Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';

const DropzoneArea = styled(Box)(({ theme }) => ({
    border: `2px dashed ${theme.palette.primary.main}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(4),
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
        transform: 'scale(1.01)',
    },
}));

const PreviewImage = styled('img')({
    maxWidth: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
    marginTop: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
});

interface PredictionResult {
    car_model: string;
    confidence: number;
    success: boolean;
    error?: string;
    details?: string;
}

interface ImageUploadProps {
    onPredictionComplete: (result: PredictionResult) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onPredictionComplete }) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            setError(null);
            setSelectedImage(URL.createObjectURL(file));
            await handleUpload(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/png': ['.png']
        },
        multiple: false,
        maxSize: 5 * 1024 * 1024 // 5MB
    });

    const handleUpload = async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await axios.post('http://localhost:5000/api/predict', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 30000 // 30 second timeout
            });

            if (response.data.success) {
                onPredictionComplete(response.data);
            } else {
                setError(response.data.error || 'Failed to process image');
                onPredictionComplete({
                    car_model: '',
                    confidence: 0,
                    success: false,
                    error: response.data.error,
                    details: response.data.details
                });
            }
        } catch (error: any) {
            console.error('Error uploading image:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to process image';
            setError(errorMessage);
            onPredictionComplete({
                car_model: '',
                confidence: 0,
                success: false,
                error: errorMessage
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setSelectedImage(null);
        setError(null);
        onPredictionComplete({
            car_model: '',
            confidence: 0,
            success: false
        });
    };

    return (
        <Card elevation={3} sx={{ 
            borderRadius: 2,
            transition: 'transform 0.3s ease',
            '&:hover': {
                transform: 'translateY(-4px)'
            }
        }}>
            <CardContent>
                <DropzoneArea {...getRootProps()}>
                    <input {...getInputProps()} />
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        {isDragActive
                            ? "Drop the image here"
                            : "Drag & drop a car image here, or click to select"}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Supports JPG, JPEG, PNG (max 5MB)
                    </Typography>
                    {selectedImage && (
                        <PreviewImage src={selectedImage} alt="Preview" />
                    )}
                    {isLoading && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            <CircularProgress />
                        </Box>
                    )}
                </DropzoneArea>
                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
                {selectedImage && !isLoading && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleClear}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 4
                            }}
                        >
                            Clear Image
                        </Button>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default ImageUpload; 