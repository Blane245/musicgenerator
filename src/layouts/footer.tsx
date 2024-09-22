import { AppBar, Box, Typography } from "@mui/material"

export interface FooterProps {
    status: string
}

export default function Footer(props: FooterProps) {
    const { status } = props
    return (
        <div className="page-footer">
            <Box
                position="fixed"
                sx={{
                    top: "auto",
                    bottom: 0,
                }}
            >
                <Typography>{status}</Typography>
            </Box>
        </div>
    )
}