import React from "react";
import {
  Paper,
  Button,
  Grid,
  Box,
  ThemeProvider,
  Typography,
  Dialog,
  DialogTitle,
  DialogActions,
  createTheme,
  Theme
} from "@mui/material";
import AudioPlayer from "material-ui-audio-player";
import theme from "../../src/themes/audiotheme";
import { makeStyles } from "@mui/styles";
import { AudioPlayerProvider } from "../../src/components/panels/audioplayerdisplay/audioplayerprovider";
const muiTheme: Theme = createTheme({});

const useStyles = makeStyles((theme) => {
  return {
    root: {
      [theme.breakpoints.down('sm')]: {
        width: '100%',
      },
    },
    loopIcon: {
      color: '#3f51b5',
      '&.selected': {
        color: '#0921a9',
      },
      '&:hover': {
        color: '#7986cb',
      },
      [theme.breakpoints.down('sm')]: {
        display: 'none',
      },
    },
    playIcon: {
      color: '#f50057',
      '&:hover': {
        color: '#ff4081',
      },
    },
    replayIcon: {
      color: '#e6e600',
    },
    pauseIcon: {
      color: '#0099ff',
    },
    volumeIcon: {
      color: 'rgba(0, 0, 0, 0.54)',
    },
    volumeSlider: {
      color: 'black',
    },
    progressTime: {
      color: 'rgba(0, 0, 0, 0.54)',
    },
    mainSlider: {
      color: '#3f51b5',
      '& .MuiSlider-rail': {
        color: '#7986cb',
      },
      '& .MuiSlider-track': {
        color: '#3f51b5',
      },
      '& .MuiSlider-thumb': {
        color: '#303f9f',
      },
    },
  };
});

export default function App() {
  const RegisPlayer = ({
    useStyles = {},
    color = "primary",
    size = "default",
    elevation = 1,
    transcript = "",
    ...rest
  }) => {
    const [openDialog, setOpenDialog] = React.useState(false);
    const iconSize = {
      small: 20,
      default: 24,
      large: 36,
      inherit: "inherit"
    }[size];
    const fontSize = {
      small: theme.typography.body2.fontSize,
      default: theme.typography.body1.fontSize,
      large: theme.typography.body1.fontSize
    }[size];
    const spacing = {
      small: { x: 1, y: 0.5, z: 1 },
      default: { x: 1, y: 0.75, z: 1 },
      large: { x: 1.5, y: 1.5, z: 2 }
    }[size];
    const minWidth = {
      small: 220,
      default: 250,
      large: 320
    }[size];

    const useClasses = makeStyles((theme) => ({
      paper: {
        minWidth: minWidth
      },
      root: {
        background: "none",
        "& .MuiGrid-item": {
          display: "flex",
          alignItems: "center"
        },
        "& div[class*='volumeControlContainer']": {
          display: "none"
        },
        "& .MuiSvgIcon-root": {
          fontSize: iconSize
        }
      },
      progressTime: {
        fontSize: fontSize
      },
      ...useStyles
    }));
    const customIcon = makeStyles((theme) => ({
      root: {
        cursor: "pointer",
        "&:hover": {
          color:
            theme.palette[
              ["primary", "secondary"].includes(color) ? color : "primary"
            ].light
        }
      }
    }));
    const classes = useClasses();
    const customIconClasses = customIcon();
    return (
      <AudioPlayerProvider>
        <Paper elevation={elevation} className={classes.paper}>
          <Box px={spacing?.x} py={spacing?.y}>
            <Grid container alignItems="left">
              <Grid item xs>
                <AudioPlayer
                //   variation={color}
                {...rest}
                variation="primary"
                  elevation={0}
                  useStyles={useClasses}
                  spacing={spacing?.z}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Audio Controls</DialogTitle>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </AudioPlayerProvider>
    );
  };

  const styles = {
    paper: {
      minWidth: 320
      //borderRadius: 32
    }
  };

  return (
    <React.Fragment>
      <ThemeProvider theme={theme}>
        <Box mb={2}>
          <Typography paragraph>Audio Controls</Typography>
          <AudioPlayer
            variation="primary"
            useStyle="small"
            src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
          />
        </Box>
      </ThemeProvider>
    </React.Fragment>
  );
}
