<style>
.picture {
display:block; 
margin-left: auto; 
margin-right: auto;
}
</style>
# Volume Envelop Processing for Soundfont Presets

The processing defined in this section is the responsbility of the **realizeSources** function. This function takes the rawSourceData created by **getPresetNode** and constructs the appriopriate gain envelop for each note during preview and recording. 

Soundfont2, following the SoundFont Specifiction 2.1, defines several generators that determine how the gain of the sampled signal is to be determined over the time period of the sound. All time values are in timecents. When converted to time, the shortest time interval is set to 10 ms. There are several distinct regions:

| Region | Generator |Definition |
| -------------- | ------------ | --------------------------- |
| delay | delayVolEnv | The delay time from the time when the note starts until the time that the attack begins. During this time the gain is set to a minimum value = 0.001 (or silent). The default value is -12000 timecents. |
| attack | attackVolEnv | The time from the end of the delay interval to the start of the hold interval. During this time, the gain increases exponentially fromm the minimum to the maximum gain. The default value is -12000 timecents. |
| hold | holdVolEnv | The time from the end of the attack interval to the start of the decay interval. During this time, the gain holds at the maximum value. The default value is -12000 timecents. |
| decay | decayVolEnv | The time from the end of the hold interval to the start of the start of the sustain interval. The gain decreases to the level as defined by sustainVolEnv. The default value is -12000 timecents. |
| release | releaseVolEnv | The time from the end of the note to the completion of the release phase. During this time, the gain decreases to the minimum value.  The default value is -12000 timecents.|
| sustain | sustainVolEnv | This is the decrease in level, expressed in centibels, to which the gain ramps during the decay phase. This is called the sustained gain. A value less than or equal to zero implies no decay. A positive value indicates a decrease in gain the corresponding level. The default value is 0 centibels. |

CMG starts and stop notes based on algorithms, not based on a human pressing and releasing keys. The note start and stop times are determined from the start and stop times of the generator and, in the case of the algorithmic generator, the speed parameter which start and stop individual notes. 

There are several special cases to consider. First, define the following times:

| Time | Definition |
| ---- | ---------- |
| t0 | The start time of the note |
| t1 | t0 + delay |
| t2 | t1 + attack |
| t3 | t2 + hold |
| t4 | t3 + delay |
| t5 | The stop time of the note |
| t6 | t5 + release |

the following cases apply. Each is exclusive

- t4 < t5 (full delay, attack, hold, decay): 
    - set gain to minimum at t0 and t1
    - ramp gain to maximum at t2
    - set gain to maximum at t2 and t3
    - ramp gain to sustain level at t4
    - set gain to sustain level at t5
    - ramp gain to minimum at t6 if not ready at a minimum otherwise set it to minimum
- t3 < t5 (full delay, attack, hold, interpolated decay):
    - set gain to minimum at t0 and t1
    - ramp gain to maximum at t2
    - set gain to maximum at t2 and t3
    - determine the gain level at t5 based on linear interpolation between t3 and t4 using the maximum and sustained gains.
    - set gain to interpolated at t5
    - ramp gain to minimum at t6 if not ready at a minimum othersiwse set it to minimum
- t2 < t5 (full delay and attack, shortened hold, not decay): 
    - set gain to minimum at t0 and t1
    - ramp gain to maximum at t2
    - set gain to maximum at t2 and t5
    - ramp gain to minimum at t6
- t1 < t5 (full delay, shortened attack, no hold or decay):
    - set gain to minimum at t0 and t1
    - determine the gain level at t5 based on linear interpolation between t1 and t2 using the minimum gain and maximum gain
    - set gain to maximum at t5
    - ramp gain to minimum at t6
- t0 < t5 (shortened delay - note will not sound):
    - set gain to minimum at t0, t5, and t6

