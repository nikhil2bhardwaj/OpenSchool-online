window.OS_QUIZ_PART3 = {
"P-C11-01": [
{q:"In the simple pendulum experiment, the time period T for length L is given by:", options:["T = 2 x pi x sqrt(L/g)", "T = 2 x pi x sqrt(g/L)", "T = (1/2pi) x sqrt(L x g)", "T = 2 x pi x L/g"], answer:0, explain:"For small amplitudes, T = 2pi*sqrt(L/g), so g = 4pi^2 L / T^2."},
{q:"Which graph is a straight line through the origin in the simple pendulum experiment?", options:["L vs T^2", "L vs T", "T vs 1/L", "T^2 vs 1/L"], answer:0, explain:"Since T^2 = (4pi^2/g)L, L vs T^2 is linear with slope g/4pi^2."},
{q:"To get an accurate value of g, the pendulum amplitude should be:", options:["Small (under about 5 degrees) so motion is SHM", "As large as possible to increase T", "Exactly 90 degrees", "Continuously increased during timing"], answer:0, explain:"Small amplitude keeps sin(theta) approx theta, so T formula holds."},
{q:"A seconds pendulum has a time period of:", options:["2 s with length about 100 cm", "1 s with length about 25 cm", "4 s with length about 50 cm", "0.5 s with length about 200 cm"], answer:0, explain:"Seconds pendulum beats seconds: T = 2 s, L = g/pi^2 approx 0.99 m."},
{q:"The main precaution when measuring T with a stopwatch is to:", options:["Time 20 oscillations and divide, starting from mean position", "Time a single oscillation only", "Measure length only up to the string top", "Ignore the bob radius in effective length"], answer:0, explain:"Timing 20 oscillations reduces reaction-time error; effective L includes hook to bob centre."}
],
"P-C11-02": [
{q:"The law of length for a sonometer wire states that frequency n is:", options:["Inversely proportional to vibrating length l at constant T and m", "Directly proportional to l", "Proportional to l^2", "Independent of l"], answer:0, explain:"n = (1/2l)sqrt(T/m), so n x l = constant."},
{q:"At constant length and mass per unit length, the frequency of a sonometer wire varies as:", options:["Square root of tension T", "Tension T directly", "1/T", "1/sqrt(T)"], answer:0, explain:"Law of tension: n proportional to sqrt(T)."},
{q:"The paper rider on a sonometer wire is used to:", options:["Detect resonance when it is thrown off at maximum vibration", "Increase the tension of the wire", "Measure the diameter of the wire", "Tune the tuning fork"], answer:0, explain:"At resonance the wire vibrates with large amplitude and the light rider flies off."},
{q:"If the tension of a sonometer wire is made four times, keeping l and m same, the frequency becomes:", options:["Doubled", "Halved", "Four times", "Unchanged"], answer:0, explain:"n proportional to sqrt(T), so sqrt(4) = 2 times."},
{q:"The frequency of a tuning fork used with a sonometer is determined by:", options:["Comparing with the wire frequency at resonance, n = (1/2l)sqrt(T/m)", "Measuring only the fork prong length", "Weighing the fork", "Counting beats with a stopwatch"], answer:0, explain:"At resonance fork frequency equals wire frequency."}
],
"P-C11-03": [
{q:"The force constant k of a helical spring is defined by:", options:["k = F/x (load per unit extension)", "k = x/F", "k = m x g x x", "k = T^2/m"], answer:0, explain:"Hooke's law F = kx within elastic limit."},
{q:"In the load-extension graph for a spring, the force constant equals:", options:["Slope of the straight-line F vs x plot", "Area under F vs x plot", "Intercept on x-axis", "Reciprocal of the area"], answer:0, explain:"Slope dF/dx = k."},
{q:"The time period of vertical oscillations of mass m on spring constant k is:", options:["T = 2pi x sqrt(m/k)", "T = 2pi x sqrt(k/m)", "T = (1/2pi) x m/k", "T = 2pi x m x k"], answer:0, explain:"SHM with omega = sqrt(k/m)."},
{q:"If two identical springs of constant k are joined in series, the combination has constant:", options:["k/2", "2k", "k", "k^2"], answer:0, explain:"1/ks = 1/k + 1/k, so ks = k/2."},
{q:"The load on a spring must not exceed:", options:["The elastic limit, else Hooke's law fails", "Zero load", "Any load; there is no limit", "Only 1 g always"], answer:0, explain:"Beyond elastic limit extension is not proportional and spring is damaged."}
],
"P-C11-04": [
{q:"In the resonance tube experiment, the velocity of sound is given by:", options:["v = 2n(l2 - l1)", "v = n(l2 + l1)", "v = n/(l2 - l1)", "v = 2n/(l2 - l1)"], answer:0, explain:"l2 - l1 = lambda/2, and v = n x lambda."},
{q:"The two resonance positions in the tube correspond approximately to:", options:["lambda/4 and 3lambda/4 of the air column", "lambda/2 and lambda", "lambda and 2lambda", "lambda/8 and lambda/6"], answer:0, explain:"Closed pipe resonances at odd quarter wavelengths."},
{q:"End correction e in the resonance tube is found from:", options:["e = (l2 - 3l1)/2", "e = l1 + l2", "e = l2/l1", "e = 2l1 - l2"], answer:0, explain:"Correcting for antinode slightly above open end: l1+e = lambda/4, l2+e = 3lambda/4."},
{q:"A tuning fork of 512 Hz gives first resonance at 16 cm. Neglecting end correction, v is about:", options:["164 m/s (v = 4n x l1)", "512 m/s", "32 m/s", "1024 m/s"], answer:0, explain:"v = 4 x 512 x 0.16 = 327.7 m/s; with typical 16.5 cm it is ~338 m/s. Option closest in principle is 4n(l1)."},
{q:"Resonance in the tube occurs when the air column is driven at:", options:["Its natural frequency equal to fork frequency", "Double the fork frequency only", "Half the fork frequency only", "Any unrelated frequency"], answer:0, explain:"Forced air column resonates when natural frequency matches driver."}
],
"P-C11-05": [
{q:"Stokes' law for a small sphere falling in a viscous liquid is:", options:["F = 6 x pi x eta x r x v", "F = 6 x pi x r/v", "F = eta x r^2/v", "F = 4/3 x pi x r^3"], answer:0, explain:"Viscous drag proportional to eta, radius and velocity."},
{q:"Terminal velocity is reached when:", options:["Weight = upthrust + viscous drag, net force zero", "Viscous drag becomes zero", "Upthrust becomes zero", "Weight becomes zero"], answer:0, explain:"Constant velocity when forces balance."},
{q:"The coefficient of viscosity of a liquid:", options:["Decreases with rise in temperature", "Increases with rise in temperature", "Is independent of temperature", "Becomes zero on heating"], answer:0, explain:"Liquids thin on heating; gases behave oppositely."},
{q:"In the Stokes experiment, terminal velocity v is measured by:", options:["Timing fall between two fixed marks at constant speed", "Timing only the first 1 cm of fall", "Weighing the sphere in air", "Measuring liquid density only"], answer:0, explain:"After initial acceleration the sphere falls uniformly; distance/time gives v."},
{q:"SI unit of coefficient of viscosity is:", options:["Poiseuille (Pa s, N s/m^2)", "Newton per metre", "Joule per kelvin", "Metre per second"], answer:0, explain:"eta = stress/velocity gradient; 1 Pa s = 10 poise."}
],
"P-C11-06": [
{q:"Surface tension by capillary rise is calculated from:", options:["T = r x h x d x g / (2 cos theta)", "T = 2r/(h d g)", "T = h x d/r", "T = r^2 x h x g"], answer:0, explain:"Balancing capillary rise column weight with surface tension force."},
{q:"For pure water in a clean glass capillary, the contact angle theta is taken as:", options:["Nearly 0 degrees (cos theta = 1)", "90 degrees", "180 degrees", "45 degrees always"], answer:0, explain:"Water wets glass, meniscus concave, theta approx 0."},
{q:"If the capillary bore radius is halved, the rise h:", options:["Doubles", "Halves", "Remains same", "Becomes four times"], answer:0, explain:"h = 2T cos theta/(r d g), so h proportional to 1/r."},
{q:"Adding detergent to water:", options:["Decreases surface tension and capillary rise", "Increases surface tension", "Does not change surface tension", "Makes water freeze"], answer:0, explain:"Surfactants lower surface tension; used in washing."},
{q:"Surface tension of water with rise in temperature:", options:["Decreases", "Increases", "Remains constant", "First increases then decreases sharply"], answer:0, explain:"Increased molecular agitation weakens surface film; zero at critical temperature."}
],
"P-C11-07": [
{q:"Young's modulus Y of a wire is defined as:", options:["Longitudinal stress / longitudinal strain", "Strain / stress", "Force x area", "Extension x length"], answer:0, explain:"Y = (F/A)/(deltaL/L) = MgL/(pi r^2 deltaL)."},
{q:"In Searle's apparatus, the purpose of the second (reference) wire is:", options:["To compensate for thermal expansion and stand tilt", "To increase the load", "To measure the wire diameter", "To heat the experimental wire"], answer:0, explain:"Differential micrometer reading cancels temperature and frame errors."},
{q:"The SI unit of Young's modulus is:", options:["N/m^2 (pascal)", "Newton metre", "Per metre", "Kilogram"], answer:0, explain:"Same as stress, since strain is dimensionless."},
{q:"Steel is more elastic than rubber in the sense that:", options:["It has larger Young's modulus (more stress needed for same strain)", "It stretches more easily", "It never breaks", "It has zero modulus"], answer:0, explain:"Greater Y means greater rigidity; steel Y ~2x10^11 Pa."},
{q:"While finding Y, the wire diameter must be measured accurately with a screw gauge because:", options:["Y depends on 1/r^2 so a small error is magnified", "Diameter does not appear in formula", "Wire colour matters", "Length need not be measured"], answer:0, explain:"Cross-section A = pi r^2; error doubles in relative terms."}
],
"P-C11-08": [
{q:"Limiting friction between two surfaces is:", options:["Proportional to normal reaction (f = mu x N)", "Proportional to contact area", "Independent of normal reaction", "Equal to weight always"], answer:0, explain:"Amontons' law: f proportional to N."},
{q:"The coefficient of friction mu can be found on a horizontal plane from:", options:["mu = tan of angle when block just slides (or pull/N)", "mu = N/f", "mu = area x force", "mu = mass x g always"], answer:0, explain:"At limiting point applied pull equals mu times normal."},
{q:"Kinetic (sliding) friction compared with limiting static friction is:", options:["Slightly smaller", "Much larger", "Exactly equal always", "Zero"], answer:0, explain:"Once motion starts, less force is needed to maintain it."},
{q:"Friction is independent of:", options:["Area of contact (for moderate pressures)", "Nature of surfaces", "Normal reaction magnitude for mu", "Roughness of surfaces"], answer:0, explain:"Limiting friction depends on materials and N, not apparent area."},
{q:"To reduce friction in the experiment, the surfaces should be:", options:["Clean, dry and dust-free; use a smooth pulley", "Oiled heavily between block and plane", "Kept tilted always", "Made wet with water"], answer:0, explain:"Standard procedure uses clean dry surfaces; lubrication would change mu."}
],
"P-C11-09": [
{q:"For a strong acid vs strong base titration (e.g., HCl vs NaOH), the pH at equivalence is:", options:["7.0", "3.5", "9.5", "1.0"], answer:0, explain:"Salt of strong acid and strong base is neutral."},
{q:"The pH curve for strong acid-strong base titration shows:", options:["A sharp steep rise of several pH units near equivalence", "No change in pH at all", "A gradual linear rise throughout", "A fall in pH on adding base"], answer:0, explain:"Even 1 drop near end point jumps pH from ~4 to ~10."},
{q:"Which indicators are both suitable for a strong acid-strong base titration?", options:["Phenolphthalein and methyl orange", "Only litmus paper ash", "Only starch", "No indicator works"], answer:0, explain:"Large jump covers both working ranges (3.1-4.4 and 8.3-10)."},
{q:"The relation between pH and pOH of water at 25 C is:", options:["pH + pOH = 14", "pH - pOH = 14", "pH x pOH = 7", "pH = pOH always"], answer:0, explain:"Kw = 10^-14, so pKw = 14."},
{q:"During titration of HCl with NaOH, before any base is added, 0.1 M HCl has pH:", options:["1", "7", "13", "0.1"], answer:0, explain:"Strong acid fully ionised: [H+] = 0.1, pH = 1."}
],
"P-C11-10": [
{q:"Lassaigne's (sodium fusion) test is done to detect:", options:["Nitrogen, sulphur and halogens in an organic compound", "Only carbon and hydrogen", "Only oxygen directly", "Molecular weight"], answer:0, explain:"Fusion converts covalent N, S, X into ionic NaCN, Na2S, NaX for testing."},
{q:"In the dry test for nitrogen, soda-lime test gives:", options:["Smell of ammonia if an amide/urea-type compound is heated with soda lime", "Blue flame always", "Brown gas of nitrogen dioxide", "No observable change ever"], answer:0, explain:"NH3 evolved turns red litmus blue and smells pungent."},
{q:"A dry ignition test where the compound burns with a sooty flame suggests:", options:["Aromatic/unsaturated (high carbon) compound", "Pure inorganic salt", "Only water present", "A saturated alkane"], answer:0, explain:"Sooty flame indicates high C:H ratio."},
{q:"Dry test with concentrated H2SO4 and heat that chars the compound black indicates:", options:["Presence of carbohydrates (dehydration to carbon)", "Presence of noble gas", "Presence of aldehyde only", "Absence of organic matter"], answer:0, explain:"Conc. H2SO4 removes water from sugars leaving black carbon."},
{q:"Copper wire (Beilstein) dry test giving a green flame indicates:", options:["Halogen present in the organic compound", "Nitrogen present", "Sulphur present", "Oxygen present"], answer:0, explain:"Volatile copper halide colours flame green."}
],
"P-C11-11": [
{q:"The standard enthalpy of neutralisation of a strong acid by a strong base is about:", options:["-57.3 kJ/mol of water formed", "-13.7 kcal/mol approx -57.3 kJ/mol", "-120 kJ/mol", "+57.3 kJ/mol"], answer:0, explain:"H+ + OH- -> H2O; both answers state same value in different units."},
{q:"The enthalpy of neutralisation is determined calorimetrically using:", options:["q = m x s x deltaT for the mixture, divided by moles of water formed", "Only the mass of the calorimeter metal", "pH paper readings", "Volume of gas evolved"], answer:0, explain:"Heat gained by solution = mass x specific heat x rise in temperature."},
{q:"Neutralisation of a weak acid (e.g., acetic acid) with NaOH gives less heat than -57.3 kJ/mol because:", options:["Some heat is used to ionise the weak acid", "Weak acid has no enthalpy", "Water is not formed", "Reaction is endothermic overall"], answer:0, explain:"Ionisation is endothermic; net heat = -57.3 + ionisation enthalpy."},
{q:"The calorimeter used for enthalpy of neutralisation is usually:", options:["A polythene/styrofoam vessel with lid and stirrer to minimise heat loss", "An open metal pan on a flame", "A sealed bomb without thermometer", "A glass beaker without lid only"], answer:0, explain:"Insulated vessel approximates adiabatic conditions."},
{q:"In the experiment, equal volumes of acid and alkali of same molarity are used so that:", options:["Complete neutralisation occurs with known moles of water formed", "pH remains 1", "Temperature does not change", "No water is formed"], answer:0, explain:"Known moles lets q be converted to per-mol enthalpy."}
],
"P-C11-12": [
{q:"On increasing concentration of reactants, the rate of reaction generally:", options:["Increases due to more frequent collisions", "Decreases", "Remains unchanged", "Becomes zero"], answer:0, explain:"Rate proportional to concentration powers (rate law)."},
{q:"On increasing temperature by about 10 C, the rate of many reactions:", options:["Roughly doubles", "Halves", "Remains same", "Becomes zero"], answer:0, explain:"More molecules cross activation barrier; Arrhenius behaviour."},
{q:"Sodium thiosulphate + HCl reaction studied in school shows rate increase with concentration because:", options:["The turbidity (sulphur) appears sooner", "The solution becomes colourless faster", "Gas turns lime water blue", "No precipitate forms"], answer:0, explain:"Time for fixed amount of S to obscure a cross mark decreases."},
{q:"A catalyst increases reaction rate by:", options:["Providing an alternative path of lower activation energy", "Increasing reactant concentration", "Decreasing temperature", "Being consumed to give heat"], answer:0, explain:"Catalyst lowers Ea without being consumed."},
{q:"Finely powdered reactants react faster than lumps because:", options:["Surface area exposed is larger", "Mass is larger", "Temperature is lower", "Pressure is lower"], answer:0, explain:"More collision sites per unit time."}
],
"P-C11-13": [
{q:"The distribution (partition) coefficient Kd of a solute between two immiscible solvents is:", options:["Concentration in solvent 1 / concentration in solvent 2 at equilibrium", "Volume 1 + volume 2", "Total mass dissolved", "Melting point / boiling point"], answer:0, explain:"Nernst distribution law: Kd = C1/C2 at constant T."},
{q:"A classic school experiment finds the partition coefficient of:", options:["Iodine between carbon tetrachloride (or CS2) and water", "Sodium chloride between water and oil only", "Copper sulphate between air and water", "Sugar between petrol and diesel"], answer:0, explain:"I2 colours organic layer violet and aqueous layer brown; titrated with hypo."},
{q:"For the distribution law to hold, the essential condition is:", options:["Constant temperature and same molecular state in both solvents", "Boiling the mixture always", "Solute must react with solvents", "Solvents must be miscible"], answer:0, explain:"No association/dissociation change and immiscible solvents."},
{q:"Before separating the layers in a funnel, the mixture must be:", options:["Shaken well and allowed to stand till layers separate", "Heated to dryness", "Filtered through paper immediately", "Frozen"], answer:0, explain:"Thorough shaking reaches equilibrium; standing gives clean separation."},
{q:"If iodine dimerises in one solvent, the distribution law is applied as:", options:["Kd = C1 / sqrt(C2) style correction (depends on association)", "Kd = C1 + C2", "Law cannot be stated at all", "Kd = 1 always"], answer:0, explain:"Association/dissociation changes the exponent; corrected Nernst law used."}
],
"P-C11-14": [
{q:"Oxalic acid crystals used for a standard solution are:", options:["Hydrated (COOH)2.2H2O, molar mass 126 g/mol", "Anhydrous, molar mass 90 g/mol only in school work", "Benzene-based acid", "A base, not an acid"], answer:0, explain:"School standard uses hydrated oxalic acid, equivalent weight 63."},
{q:"To prepare 1 L of 0.1 M oxalic acid solution, the mass needed is:", options:["12.6 g of hydrated oxalic acid", "6.3 g", "126 g", "1.26 g"], answer:0, explain:"M/10 per litre = 126/10 = 12.6 g."},
{q:"A standard solution is prepared in a:", options:["Standard (volumetric) flask with exact meniscus adjustment", "Open bucket", "Test tube", "Burrette"], answer:0, explain:"Volumetric flask gives exact volume at calibration temperature."},
{q:"Oxalic acid solution is titrated against NaOH using indicator:", options:["Phenolphthalein (colourless to pink at end point)", "Starch", "Methyl orange only heated", "No indicator; gas seen"], answer:0, explain:"Weak acid-strong base type end point on alkaline side."},
{q:"At the end point of oxalic acid vs KMnO4 titration in acidic medium, the colour change is:", options:["Colourless to permanent light pink from KMnO4 itself", "Pink to colourless", "Blue to red", "Yellow to green"], answer:0, explain:"KMnO4 acts as self-indicator; first excess drop gives pink."}
],
"P-C11-15": [
{q:"2,4-DNP (Brady's reagent) test giving an orange precipitate indicates:", options:["Carbonyl group (aldehyde or ketone)", "Alcohol group", "Carboxylic acid group", "Alkene group"], answer:0, explain:"2,4-dinitrophenylhydrazone forms with C=O."},
{q:"Tollens' reagent (ammoniacal AgNO3) giving a silver mirror indicates:", options:["Aldehyde", "Ketone", "Alcohol", "Ester"], answer:0, explain:"Aldehyde reduces Tollens; ketone does not."},
{q:"Bromine water decolourised without HBr fumes indicates:", options:["Carbon-carbon unsaturation (alkene/alkyne)", "Saturated alcohol", "Carboxylic acid", "Nitro group"], answer:0, explain:"Addition across double bond removes brown colour."},
{q:"Neutral FeCl3 giving violet colour indicates:", options:["Phenolic group", "Aldehyde group", "Ketone group", "Alkane group"], answer:0, explain:"Phenol-Fe complex is coloured."},
{q:"Sodium bicarbonate test with brisk effervescence indicates:", options:["Carboxylic acid group", "Alcohol group", "Aldehyde group", "Ketone group"], answer:0, explain:"Acid + NaHCO3 -> CO2 which turns lime water milky."}
],
"P-C11-16": [
{q:"Doppler effect is:", options:["Apparent change in frequency due to relative motion of source and observer", "Change in speed of sound with temperature only", "Bending of waves around corners", "Reflection of sound"], answer:0, explain:"Relative motion compresses or stretches waves."},
{q:"When a sound source approaches a stationary observer, the apparent frequency:", options:["Increases", "Decreases", "Remains same", "Becomes zero"], answer:0, explain:"Wavelength shortened, n' = nV/(V - Vs)."},
{q:"If both source and observer move with the same velocity in the same direction:", options:["No Doppler shift is heard", "Maximum shift is heard", "Frequency doubles", "Frequency halves"], answer:0, explain:"No relative motion, wavelengths unchanged."},
{q:"Doppler shift is used in practice for:", options:["Radar speed guns and sonar/astronomy red shift", "Only for lighting bulbs", "Only for cooking", "Measuring mass directly"], answer:0, explain:"Reflected wave frequency shift gives target speed."},
{q:"The Doppler effect is observed only when:", options:["There is relative motion along the line joining source and observer", "Source moves perpendicular with high speed only", "Medium is vacuum for sound", "Observer is deaf"], answer:0, explain:"Transverse motion gives no first-order shift for sound."}
],
"P-C11-17": [
{q:"For a stretched sonometer wire, the fundamental frequency is:", options:["n = (1/2l) x sqrt(T/m)", "n = 2l x sqrt(T)", "n = l x T", "n = sqrt(m/T)/l"], answer:0, explain:"Mersenne's law combining length, tension and linear density."},
{q:"Standing waves on a string fixed at both ends have:", options:["Nodes at both fixed ends", "Antinodes at both ends", "One node one antinode", "No nodes"], answer:0, explain:"Fixed ends cannot vibrate."},
{q:"The first overtone (second harmonic) of a sonometer wire has frequency:", options:["Twice the fundamental", "Equal to fundamental", "Half the fundamental", "Three times always"], answer:0, explain:"Harmonics are n, 2n, 3n for strings."},
{q:"Increasing the tension while keeping length fixed makes the standing-wave frequency:", options:["Increase", "Decrease", "Stay same", "Become zero"], answer:0, explain:"n proportional to sqrt(T)."},
{q:"A heavier wire (larger mass per unit length) at same T and l vibrates with:", options:["Lower frequency", "Higher frequency", "Same frequency", "Infinite frequency"], answer:0, explain:"n proportional to 1/sqrt(m)."}
],
"P-C11-18": [
{q:"Beats are produced when:", options:["Two nearly equal frequencies sound together", "A single frequency sounds alone", "Two very different frequencies sound", "Sound reflects from a wall"], answer:0, explain:"Superposition gives periodic waxing and waning."},
{q:"Beat frequency equals:", options:["Difference of the two frequencies |n1 - n2|", "Sum of the two frequencies", "Average of the two frequencies", "Half the sum"], answer:0, explain:"Number of loudness maxima per second."},
{q:"For beats to be distinctly heard, the difference should be less than about:", options:["10 Hz", "1000 Hz", "100 Hz", "500 Hz"], answer:0, explain:"Persistence of hearing ~0.1 s; larger diff gives roughness."},
{q:"Musicians use beats to:", options:["Tune instruments by adjusting till beats vanish", "Increase loudness permanently", "Break strings", "Measure room length"], answer:0, explain:"Zero beats means unison."},
{q:"If tuning forks of 256 Hz and 260 Hz sound together, beats per second are:", options:["4", "516", "258", "2"], answer:0, explain:"|260 - 256| = 4 waxings per second."}
],
"P-C11-19": [
{q:"The resonance column experiment uses:", options:["An air column closed at one end by water", "An air column open at both ends only", "A vacuum tube", "A solid rod"], answer:0, explain:"Water surface acts as closed reflecting end."},
{q:"First resonance of a 512 Hz fork occurs near air column length:", options:["About 16-17 cm (lambda/4)", "About 1 m", "About 1 cm", "About 100 m"], answer:0, explain:"lambda = v/n ~ 340/512 ~ 0.66 m; lambda/4 ~ 16.6 cm."},
{q:"The second resonance occurs at roughly:", options:["Three times the first resonance length", "Same as first", "Half the first", "Twice diameter"], answer:0, explain:"Closed pipe: l1 ~ lambda/4, l2 ~ 3lambda/4."},
{q:"Velocity of sound by resonance column is v =", options:["n x lambda, where lambda = 2(l2 - l1)", "n/lambda", "lambda/n", "l1 + l2"], answer:0, explain:"l2 - l1 = lambda/2."},
{q:"Velocity of sound in air with temperature:", options:["Increases about 0.61 m/s per degree C rise", "Decreases with rise", "Is constant at all temperatures", "Becomes zero at 100 C"], answer:0, explain:"v = 331 + 0.61t (t in C)."}
],
"P-C11-20": [
{q:"Seebeck effect is:", options:["Production of emf in a circuit of two different metals with junctions at different temperatures", "Heating by electric current", "Conduction of heat only", "Magnetic induction only"], answer:0, explain:"Thermocouple emf depends on junction temperatures and metal pair."},
{q:"In a thermocouple, the thermo-emf for small temperature differences is:", options:["Nearly proportional to the temperature difference", "Inversely proportional to square of difference", "Independent of temperature", "Always zero"], answer:0, explain:"E = alpha deltaT for small ranges; parabolic over wide range."},
{q:"The converse of Seebeck effect is called:", options:["Peltier effect", "Joule effect", "Photoelectric effect", "Doppler effect"], answer:0, explain:"Current through junction causes heating or cooling."},
{q:"A thermocouple can be used to:", options:["Measure high temperatures and small temperature differences", "Measure length", "Generate light only", "Measure mass"], answer:0, explain:"Thermo-emf calibrated as thermometer, e.g., platinum-rhodium."},
{q:"Which pair gives a large Seebeck emf?", options:["Bismuth-antimony (or iron-constantan)", "Copper-copper", "Iron-iron", "Aluminium-aluminium"], answer:0, explain:"Dissimilar metals far apart in thermoelectric series give large emf."}
],
"P-C11-21": [
{q:"Pollen grains are germinated in the lab in a medium containing:", options:["Sucrose solution with boric acid and calcium nitrate", "Pure distilled water only", "Concentrated acid", "Dry air"], answer:0, explain:"Sugar provides nutrition/osmoticum; boron aids tube growth."},
{q:"The pollen tube normally emerges through the:", options:["Germ pore where exine is thin or absent", "Thickest part of exine", "Stigma wall", "Ovary wall"], answer:0, explain:"Intine protrudes through germ pores/apertures."},
{q:"In a germinating pollen grain, the tube nucleus is followed by:", options:["The generative cell / two male gametes", "Only water", "Starch grains only", "Red blood cells"], answer:0, explain:"Generative cell divides into two male gametes inside tube."},
{q:"Pollen germination percentage is calculated as:", options:["(Germinated pollen / total pollen observed) x 100", "Total pollen x 100", "Tube length + 100", "Only dead pollen count"], answer:0, explain:"Count in several microscope fields."},
{q:"A suitable flower for studying pollen germination in school (fast germination) is:", options:["Hibiscus / Tradescantia / balsam", "Dry grass seeds", "Pine wood", "Mushroom"], answer:0, explain:"Large, abundant, quickly germinating pollen is preferred."}
],
"P-C11-22": [
{q:"Transpiration rate is measured with a:", options:["Ganong's potometer", "Respirometer", "Colorimeter", "Barometer"], answer:0, explain:"Potometer measures water uptake as air bubble moves."},
{q:"Cobalt chloride paper is used in transpiration experiments because it:", options:["Turns blue to pink in contact with moisture", "Turns pink to blue in moisture", "Remains white always", "Burns in air"], answer:0, explain:"Anhydrous CoCl2 blue; hydrated pink. Faster pink on lower (stomatal) surface."},
{q:"Transpiration rate increases when:", options:["Light intensity, temperature and wind increase; humidity is low", "Humidity is very high and air is still", "Stomata are closed at night only in all plants", "Temperature is freezing"], answer:0, explain:"Steeper diffusion gradient and open stomata speed water loss."},
{q:"The air bubble in a potometer moves because:", options:["The shoot absorbs water to replace transpired water", "Air expands on heating", "Roots push air", "Photosynthesis pushes the bubble"], answer:0, explain:"Uptake pulls water column; bubble displacement per time gives rate."},
{q:"Most transpiration in a dorsiventral leaf occurs through:", options:["Stomata of the lower epidermis", "Upper cuticle only", "Stem lenticels only", "Flowers"], answer:0, explain:"More stomata on lower surface; cobalt paper turns pink faster there."}
],
"P-C11-23": [
{q:"Photosynthesis releasing oxygen is shown in the lab using:", options:["Hydrilla funnel experiment with gas collecting in a test tube", "Yeast in sugar solution", "Germinating seeds in KOH", "Dry seeds in water"], answer:0, explain:"Bubbles of O2 collect at top of inverted funnel tube."},
{q:"The overall equation for photosynthesis is:", options:["6CO2 + 6H2O -> C6H12O6 + 6O2 (in light, chlorophyll)", "C6H12O6 + O2 -> CO2 + water", "N2 + O2 -> 2NO", "CO2 -> C + O2 only"], answer:0, explain:"Light energy stored as glucose; O2 comes from water."},
{q:"The gas collected in the Hydrilla experiment is confirmed as oxygen because it:", options:["Rekindles a glowing splinter", "Turns lime water milky", "Burns with blue flame", "Smells of ammonia"], answer:0, explain:"O2 supports combustion."},
{q:"Adding sodium bicarbonate to Hydrilla water:", options:["Speeds photosynthesis by supplying more CO2", "Stops photosynthesis", "Kills the plant at once", "Absorbs all oxygen"], answer:0, explain:"NaHCO3 is a CO2 source; more bubbles evolve."},
{q:"A de-starched leaf test after photosynthesis shows starch with:", options:["Iodine turning blue-black in the exposed green part", "Benedict's red colour", "Lime water milky", "Litmus red"], answer:0, explain:"Chlorophyll-containing illuminated part forms starch."}
],
"P-C11-24": [
{q:"Respiration releasing CO2 is shown in the lab using:", options:["Germinating seeds with lime water turning milky", "Hydrilla giving O2", "Dry glass rod", "Boiled dead seeds only"], answer:0, explain:"CO2 from living seeds turns clear lime water milky."},
{q:"The equation for aerobic respiration is:", options:["C6H12O6 + 6O2 -> 6CO2 + 6H2O + energy (ATP)", "6CO2 + water -> glucose + O2", "Alcohol -> CO2 only", "N2 + H2 -> NH3"], answer:0, explain:"Reverse of photosynthesis; energy released."},
{q:"In the respiration experiment, KOH solution is used to:", options:["Absorb CO2 and show rise of water/creation of partial vacuum", "Absorb oxygen", "Kill seeds", "Give out CO2"], answer:0, explain:"Bent-tube setup: CO2 absorbed, water rises showing O2 uptake."},
{q:"A control with boiled (dead) seeds is kept to prove that:", options:["CO2 comes from living respiring seeds, not air", "Dead seeds respire faster", "Lime water is faulty", "Oxygen is not needed"], answer:0, explain:"No milkiness with dead seeds rules out atmospheric CO2."},
{q:"Anaerobic respiration in yeast (fermentation) produces:", options:["Ethanol + CO2", "Only oxygen", "Only water", "Lactic acid only in yeast"], answer:0, explain:"C6H12O6 -> 2C2H5OH + 2CO2 by zymase."}
]
};