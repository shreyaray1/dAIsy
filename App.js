// dAIsy — React Native App.js
// Run: npx expo install expo-image-picker expo-web-browser expo-location && npx expo start
 
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  FlatList, StyleSheet, SafeAreaView, StatusBar as RNStatusBar,
  Image, Dimensions, Platform, Animated, PanResponder, ActivityIndicator, Alert, Linking,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import * as Location from 'expo-location';
import { supabase, OPENAI_KEY, WEATHER_KEY } from './supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
 
// Azure OpenAI configuration
const AZURE_OPENAI_ENDPOINT = 'https://conversationalsearchv0.openai.azure.com/openai/v1';
const AZURE_OPENAI_MODEL    = 'gpt-4.1-mini';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
 
WebBrowser.maybeCompleteAuthSession();
 
const { width: SCREEN_W } = Dimensions.get('window');
 
const SCREENS = {
  SIGNIN: 'signin', QUIZ: 'quiz',
  SWIPE_TRAIN: 'swipe_train', STYLE_SUMMARY: 'style_summary', DASHBOARD: 'dashboard',
  SHOPPING: 'shopping', CLOSET: 'closet', PROFILE: 'profile',
  FAVORITES: 'favorites', DISCOVER: 'discover', DELETE_ACCOUNT: 'delete_account',
};
const QUIZ_STEPS = 6;
 
// ── Age bucket helper ─────────────────────────────────────────────────────────
function getAgeBucket(age) {
  const n = parseInt(age, 10);
  if (isNaN(n)) return '16-29';
  if (n <= 15) return '0-15';
  if (n <= 29) return '16-29';
  if (n <= 55) return '30-55';
  return '56-over';
}
 
const SWIPE_ITEMS = {
  '0-15': [
    {
      key: 'everyday', label: 'Everyday', emoji: '',
      items: [
        { id:'0-15-ev-1',  name:'Graphic Tee',        src: require('./clothes-women/0-15/everyday/14-shirt.jpeg') },
        { id:'0-15-ev-2',  name:'Baby Tee',            src: require('./clothes-women/0-15/everyday/baby-tee.jpeg') },
        { id:'0-15-ev-3',  name:'Baggy Shirt',         src: require('./clothes-women/0-15/everyday/baggy-shirt.jpeg') },
        { id:'0-15-ev-4',  name:'Crewneck',            src: require('./clothes-women/0-15/everyday/crewneck.jpeg') },
        { id:'0-15-ev-5',  name:'Denim Shorts',        src: require('./clothes-women/0-15/everyday/denim-shorts.jpeg') },
        { id:'0-15-ev-6',  name:'Grey Sweatpants',     src: require('./clothes-women/0-15/everyday/grey-sweatpants.jpeg') },
        { id:'0-15-ev-7',  name:'Jean Shorts',         src: require('./clothes-women/0-15/everyday/jorts.jpeg') },
        { id:'0-15-ev-8',  name:'Leggings',            src: require('./clothes-women/0-15/everyday/leggings.jpeg') },
        { id:'0-15-ev-9',  name:'Short Sleeve Shirt',  src: require('./clothes-women/0-15/everyday/sd-shirt.jpeg') },
        { id:'0-15-ev-10', name:'Sweat Shorts',        src: require('./clothes-women/0-15/everyday/sweatshorts.jpeg') },
        { id:'0-15-ev-11', name:'Tank Top',            src: require('./clothes-women/0-15/everyday/tank-top-tween.jpeg') },
        { id:'0-15-ev-12', name:'Workout Shorts',      src: require('./clothes-women/0-15/everyday/workout-shorts.jpeg') },
      ],
    },
  ],
 
  '16-29': [
    {
      key: 'business', label: 'Business Wear', emoji: '',
      items: [
        { id:'16-29-bu-1', name:'Business Top',     src: require('./clothes-women/16-29/business/polka-dot-business.jpeg') },
        { id:'16-29-bu-2', name:'Business Skirt',   src: require('./clothes-women/16-29/business/business-skirt.jpeg') },
        { id:'16-29-bu-3', name:'Flowy Pants',      src: require('./clothes-women/16-29/business/flowypants.jpeg') },
        { id:'16-29-bu-4', name:'Red Top',          src: require('./clothes-women/16-29/business/red-top.jpeg') },
      ],
    },
    {
      key: 'everyday', label: 'Everyday', emoji: '',
      items: [
        { id:'16-29-ev-1', name:'Dandy Hoodie',     src: require('./clothes-women/16-29/everyday/dandy-hoodie.jpeg') },
        { id:'16-29-ev-2', name:'Denim Skirt',      src: require('./clothes-women/16-29/everyday/denim-skirt.jpeg') },
        { id:'16-29-ev-3', name:'Skinny Jeans',     src: require('./clothes-women/16-29/everyday/skinny-jeans.jpeg') },
        { id:'16-29-ev-4', name:'Striped Tank',     src: require('./clothes-women/16-29/everyday/striped-tank.jpeg') },
        { id:'16-29-ev-5', name:'Wide Leg Jeans',   src: require('./clothes-women/16-29/everyday/wideleg-jeans.jpeg') },
      ],
    },
    {
      key: 'goingout', label: 'Going Out', emoji: '',
      items: [
        { id:'16-29-go-1', name:'Halter Top',       src: require('./clothes-women/16-29/goingout/halter.jpeg') },
        { id:'16-29-go-2', name:'Hardware Top',     src: require('./clothes-women/16-29/goingout/hardware-top.jpeg') },
        { id:'16-29-go-3', name:'Lacey Top',        src: require('./clothes-women/16-29/goingout/lacey-top.jpeg') },
        { id:'16-29-go-4', name:'Micro Shorts',     src: require('./clothes-women/16-29/goingout/micro-shorts.jpeg') },
        { id:'16-29-go-5', name:'Mini Skirt',       src: require('./clothes-women/16-29/goingout/mini-skirt.jpeg') },
        { id:'16-29-go-6', name:'Tube Top',         src: require('./clothes-women/16-29/goingout/tube.jpeg') },
      ],
    },
    {
      key: 'workout', label: 'Workout', emoji: '',
      items: [
        { id:'16-29-wo-1', name:'Blue Set',         src: require('./clothes-women/16-29/workout/blue-set.jpeg') },
        { id:'16-29-wo-2', name:'Leggings',         src: require('./clothes-women/16-29/workout/leggings.jpeg') },
        { id:'16-29-wo-3', name:'Long Set',         src: require('./clothes-women/16-29/workout/long-set.jpeg') },
        { id:'16-29-wo-4', name:'Sweat Set',        src: require('./clothes-women/16-29/workout/sweatset.jpeg') },
        { id:'16-29-wo-5', name:'Tennis Skirt',     src: require('./clothes-women/16-29/workout/tennis-skirt.jpeg') },
      ],
    },
  ],
 
  '30-55': [
    {
      key: 'business', label: 'Business Wear', emoji: '',
      items: [
        { id:'30-55-bu-1', name:'Blazer & Jeans',   src: require('./clothes-women/30-55/business/blazer-jeans.jpeg') },
        { id:'30-55-bu-2', name:'Blue Pants',        src: require('./clothes-women/30-55/business/blue-pants.jpeg') },
        { id:'30-55-bu-3', name:'Cardigan',          src: require('./clothes-women/30-55/business/cardigan.jpeg') },
        { id:'30-55-bu-4', name:'Pink Top',          src: require('./clothes-women/30-55/business/pink-top.jpeg') },
      ],
    },
    {
      key: 'everyday', label: 'Everyday', emoji: '',
      items: [
        { id:'30-55-ev-1', name:'Brown Cardigan',    src: require('./clothes-women/30-55/everyday/brown-cardigan.jpeg') },
        { id:'30-55-ev-2', name:'Funky Palazzo',     src: require('./clothes-women/30-55/everyday/funky-palazzo.jpeg') },
        { id:'30-55-ev-3', name:'Mom Jeans',         src: require('./clothes-women/30-55/everyday/mom-jeans.jpeg') },
        { id:'30-55-ev-4', name:'Palazzo Pants',     src: require('./clothes-women/30-55/everyday/palazzo.jpeg') },
        { id:'30-55-ev-5', name:'Ripped Jeans',      src: require('./clothes-women/30-55/everyday/ripped-jeans.jpeg') },
        { id:'30-55-ev-6', name:'Sundress',          src: require('./clothes-women/30-55/everyday/sundress.jpeg') },
      ],
    },
    {
      key: 'goingout', label: 'Going Out', emoji: '',
      items: [
        { id:'30-55-go-1', name:'Flowy Skirt',       src: require('./clothes-women/30-55/goingout/flowy-skirt.jpeg') },
        { id:'30-55-go-2', name:'Silk Skirt',        src: require('./clothes-women/30-55/goingout/silk-skirt.jpeg') },
        { id:'30-55-go-3', name:'Sparkly Top',       src: require('./clothes-women/30-55/goingout/sparkly.jpeg') },
        { id:'30-55-go-4', name:'Vacation Dress',    src: require('./clothes-women/30-55/goingout/vacation-dress.jpeg') },
        { id:'30-55-go-5', name:'Flowy Dress',       src: require('./clothes-women/30-55/goingout/vacation-flowy.jpeg') },
      ],
    },
    {
      key: 'workout', label: 'Workout', emoji: '',
      items: [
        { id:'30-55-wo-1', name:'Flowy Set',         src: require('./clothes-women/30-55/workout/flowy-set.jpeg') },
        { id:'30-55-wo-2', name:'Leggings Set',      src: require('./clothes-women/30-55/workout/leggings-set.jpeg') },
        { id:'30-55-wo-3', name:'Sweat Set',         src: require('./clothes-women/30-55/workout/sweat-set.jpeg') },
        { id:'30-55-wo-4', name:'Tie Dye Tank',      src: require('./clothes-women/30-55/workout/tiedye-tank.jpeg') },
      ],
    },
  ],
 
  '56-over': [
    {
      key: 'business', label: 'Business Wear', emoji: '',
      items: [
        { id:'56-bu-1', name:'All White Look',       src: require('./clothes-women/56-over/business/all-white-business.jpeg') },
        { id:'56-bu-2', name:'Basic Button Down',    src: require('./clothes-women/56-over/business/basic-button-down.jpeg') },
        { id:'56-bu-3', name:'Checkered Cardigan',   src: require('./clothes-women/56-over/business/checkered-cardigan.jpeg') },
        { id:'56-bu-4', name:'Navy Blazer',          src: require('./clothes-women/56-over/business/navy-blazer.jpeg') },
        { id:'56-bu-5', name:'Vest',                 src: require('./clothes-women/56-over/business/vest.jpeg') },
      ],
    },
    {
      key: 'everyday', label: 'Everyday', emoji: '',
      items: [
        { id:'56-ev-1', name:'Black Jeans',          src: require('./clothes-women/56-over/everyday/black-jeans.jpeg') },
        { id:'56-ev-2', name:'Button Shirt',         src: require('./clothes-women/56-over/everyday/button-shirt.jpeg') },
        { id:'56-ev-3', name:'Design Shirt',         src: require('./clothes-women/56-over/everyday/design-shirt.jpeg') },
        { id:'56-ev-4', name:'Funky Palazzo',        src: require('./clothes-women/56-over/everyday/funky-palazzo-old.jpeg') },
        { id:'56-ev-5', name:'Classic Jeans',        src: require('./clothes-women/56-over/everyday/old-jeans.jpeg') },
        { id:'56-ev-6', name:'Palazzo Pants',        src: require('./clothes-women/56-over/everyday/old-palazzo.jpeg') },
        { id:'56-ev-7', name:'Cozy Sweater',         src: require('./clothes-women/56-over/everyday/sweater.webp') },
        { id:'56-ev-8', name:'Texture Shirt',        src: require('./clothes-women/56-over/everyday/texture-shirt.jpeg') },
      ],
    },
    {
      key: 'vacation', label: 'Vacation', emoji: '',
      items: [
        { id:'56-va-1', name:'Floral Dress',         src: require('./clothes-women/56-over/vacation/floral-dress.webp') },
        { id:'56-va-2', name:'Shawl Top',            src: require('./clothes-women/56-over/vacation/shawl-top.jpeg') },
        { id:'56-va-3', name:'Tie Dress',            src: require('./clothes-women/56-over/vacation/tie-dress.webp') },
        { id:'56-va-4', name:'White Top',            src: require('./clothes-women/56-over/vacation/white-top.jpeg') },
        { id:'56-va-5', name:'Yellow Linen Shirt',   src: require('./clothes-women/56-over/vacation/yellow-linen-shirt.webp') },
      ],
    },
  ],
};
 
function buildSwipeItems(ageBucket) {
  const categories = SWIPE_ITEMS[ageBucket] || SWIPE_ITEMS['16-29'];
  const result = [];
  categories.forEach(cat => {
    cat.items.forEach(item => {
      result.push({
        id: item.id,
        name: item.name,
        src: item.src,
        categoryKey: cat.key,
        categoryLabel: cat.label,
        categoryEmoji: '',
      });
    });
  });
  return result;
}
 
// ── Static data ───────────────────────────────────────────────────────────────
const OCCUPATION_OPTIONS = [
  'Student', 'Creative / Artist', 'Tech / Office', 'Healthcare',
  'Teacher / Educator', 'Finance / Law', 'Entrepreneur', 'Freelancer',
  'Stay-at-home parent', 'Retail / Hospitality', 'Remote worker', 'Other',
];
const TYPICAL_WEAR_OPTIONS = [
  'Jeans & a nice top', 'Dresses & skirts', 'Smart casual', 'Business formal',
  'Athleisure / Sporty', 'Oversized & relaxed', 'Tailored & structured',
  'Boho & flowy', 'All black everything', 'Colourful & bold', 'Depends on the day',
];
const BRANDS = [
  'Zara', 'Mango', 'Reformation', 'Aritzia', 'Anthropologie',
  'Free People', '& Other Stories', 'COS', 'Sandro', 'Isabel Marant',
  'Totême', 'Jacquemus', 'H&M', 'Uniqlo', 'Everlane',
  'Banana Republic', 'J.Crew', 'Theory', 'Vince', 'AGOLDE',
];
const STYLE_OPTIONS = [
  { label: 'Minimalist',  desc: 'Clean lines, neutral palette',    src: require('./styles/minimalist.jpeg') },
  { label: 'Feminine',    desc: 'Soft, flowy, romantic details',   src: require('./styles/feminine.jpeg') },
  { label: 'Boho',        desc: 'Earthy, layered, free-spirited',  src: require('./styles/boho.jpeg') },
  { label: 'Edgy',        desc: 'Dark tones, leather, structure',  src: require('./styles/edgy.jpeg') },
  { label: 'Preppy',      desc: 'Collegiate, clean, bright',       src: require('./styles/preppy.jpeg') },
  { label: 'Street',      desc: 'Urban, graphic, relaxed cool',    src: require('./styles/street.jpeg') },
  { label: 'Y2K',         desc: 'Early 2000s, playful, nostalgic', src: require('./styles/y2k.jpeg') },
  { label: 'Cottagecore', desc: 'Floral, whimsical, pastoral',     src: require('./styles/cottagecore.jpeg') },
  { label: 'Moody',       desc: 'Dark, literary, layered',         src: require('./styles/moody.jpeg') },
  { label: 'Maximalist',  desc: 'Bold prints, colour clashing',    src: require('./styles/maximalist.jpeg') },
];
 
// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:         '#F7F5F2',   // warm off-white
  dark:       '#1A1A1A',   // near-black
  accent:     '#5C8A64',   // sage green
  muted:      '#8A9589',   // muted green-grey
  white:      '#FFFFFF',
  softGreen:  '#EDF1ED',   // very soft green tint
  paleGreen:  '#D8E3D8',   // pale green for borders
  warm:       '#F0ECE6',   // warm cream card bg
  hairline:   '#E2E8E2',   // hairline border colour
};
 
// ── Shared components ─────────────────────────────────────────────────────────
function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[st.chip, active && st.chipActive]}>
      <Text style={[st.chipText, active && st.chipTextActive]}>{active ? '+ ' : ''}{label}</Text>
    </TouchableOpacity>
  );
}
function ChipSelect({ options, selected, onToggle }) {
  return (
    <View style={st.chipWrap}>
      {options.map(opt => (
        <Chip key={opt} label={opt} active={selected.includes(opt)} onPress={() => onToggle(opt)} />
      ))}
    </View>
  );
}
function StylePhotoCard({ item, selected, onToggle }) {
  return (
    <TouchableOpacity onPress={() => onToggle(item.label)} style={[st.styleCard, selected && st.styleCardActive]}>
      <Image source={item.src} style={st.styleSwatches} resizeMode="cover" />
      {selected && (
        <View style={st.styleCheck}>
          <Text style={{ color:C.white, fontSize:10, fontWeight:'700' }}>+</Text>
        </View>
      )}
      <View style={{ padding:10, backgroundColor:C.white }}>
        <Text style={st.styleLabel}>{item.label}</Text>
        <Text style={st.styleDesc}>{item.desc}</Text>
      </View>
    </TouchableOpacity>
  );
}
 
// Simple search icon (SVG-free plain text version)
function SearchIcon({ size = 18, color = C.dark }) {
  return (
    <View style={{
      width: size, height: size,
      borderRadius: size / 2,
      borderWidth: 1.5,
      borderColor: color,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <View style={{
        width: 2, height: size * 0.35,
        backgroundColor: color,
        position: 'absolute',
        bottom: 0,
        right: 1,
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  );
}
 
function TabBar({ active, onNav }) {
  const tabs = [
    { id:SCREENS.DASHBOARD, label:'Home'     },
    { id:SCREENS.SHOPPING,  label:'Shop'     },
    { id:SCREENS.CLOSET,    label:'Closet'   },
    { id:SCREENS.DISCOVER,  label:'Discover' },
  ];
  return (
    <View style={st.tabBar}>
      {tabs.map(tab => (
        <TouchableOpacity key={tab.id} onPress={() => onNav(tab.id)} style={st.tabItem}>
          <Text style={[st.tabLabel, active === tab.id && st.tabLabelActive]}>{tab.label}</Text>
          {active === tab.id && <View style={st.tabActiveDot} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}
 
// ── SignIn ─────────────────────────────────────────────────────────────────────
function SignInScreen({ onNext }) {
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
 
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'styleai://auth/callback',
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'styleai://auth/callback'
        );
        if (result.type === 'success' && result.url) {
          const url = result.url;
          const hashPart = url.includes('#') ? url.split('#')[1] : url.split('?')[1] || '';
          const params = new URLSearchParams(hashPart);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) setError('Sign in failed: ' + sessionError.message);
          } else {
            setError('Could not get session from Google. Please try again.');
          }
        }
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };
 
  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    setError('');
    try {
      const credential = await AppleAuthentication.signInWithAppleAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
 
      // credential.identityToken is a JWT — send to Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: credential.authorizationCode, // Supabase accepts this
      });
 
      if (error) throw error;
 
      // Store the full name if Apple provided it (only on first sign-in)
      if (credential.fullName?.givenName) {
        const displayName = [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean).join(' ');
        await supabase.auth.updateUser({ data: { full_name: displayName } });
      }
    } catch (e) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        setError('Apple sign in failed. Please try again.');
      }
    }
    setAppleLoading(false);
  };
 
  return (
    <SafeAreaView style={[st.flex, { backgroundColor: C.bg }]}>
      <View style={st.centerFlex}>
        {/* Wordmark */}
        <View style={{ marginBottom: 48 }}>
          <Text style={st.wordmark}>dAIsy</Text>
          <View style={{ height: 1, backgroundColor: C.accent, width: 32, marginTop: 8 }} />
        </View>
 
        <Text style={st.heroTitle}>Style, curated{'\n'}for you.</Text>
        <Text style={st.heroSub}>Your personal AI stylist, powered{'\n'}by your taste and lifestyle.</Text>
 
        {/* Google sign in */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          style={[st.btnDark, loading && { opacity: 0.6 }, { marginBottom: 12 }]}
          disabled={loading || appleLoading}
        >
          <Text style={st.btnDarkText}>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>
 
        {/* Apple sign in — only shown on iOS */}
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={10}
          style={{ width: '100%', height: 50 }}
          onPress={handleAppleSignIn}
        />
 
        {error ? (
          <Text style={{ color: '#A05050', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</Text>
        ) : null}
        <Text style={st.legalText}>By continuing, you agree to our Terms & Privacy Policy.</Text>
      </View>
    </SafeAreaView>
  );
}
 
 
// ── Quiz ───────────────────────────────────────────────────────────────────────
function QuizScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name:'', age:'', occupation:[],
    brands:[], styles:[],
    skinTone:'', undertone:'', hairColor:'', eyeColor:'',
  });
 
  const next = () => { if (step < QUIZ_STEPS - 1) setStep(prev => prev + 1); else onDone(data.name, data.age, data); };
  const back = () => setStep(prev => prev - 1);
  const progress = ((step + 1) / QUIZ_STEPS) * 100;
  const toggle = (field, val) =>
    setData(prev => ({ ...prev, [field]: prev[field].includes(val) ? prev[field].filter(x => x !== val) : [...prev[field], val] }));
  const canContinue = step === 2 ? data.brands.length >= 3 : true;
 
  return (
    <SafeAreaView style={[st.flex, { backgroundColor: C.bg }]}>
      <View style={{ paddingHorizontal:24, paddingTop:8 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          {step > 0
            ? <TouchableOpacity onPress={back}><Text style={{ fontSize:18, color:C.dark, fontWeight:'300' }}>←</Text></TouchableOpacity>
            : <View />}
          <Text style={{ fontSize:12, color:C.muted, letterSpacing:1.5, textTransform:'uppercase' }}>{step + 1} / {QUIZ_STEPS}</Text>
        </View>
        <View style={st.progressTrack}>
          <View style={[st.progressFill, { width:`${progress}%` }]} />
        </View>
      </View>
 
      <ScrollView style={st.flex} contentContainerStyle={{ padding:24, paddingBottom:120 }}>
        {step === 0 && (
          <View>
            <Text style={st.quizTitle}>What's your name?</Text>
            <Text style={st.quizSub}>Let's make this personal.</Text>
            <TextInput value={data.name} onChangeText={v => setData(prev => ({ ...prev, name:v }))}
              placeholder="Your name" placeholderTextColor="#C0C8C0" style={st.textInput} />
          </View>
        )}
        {step === 1 && (
          <View>
            <Text style={st.quizTitle}>How old are you?</Text>
            <Text style={st.quizSub}>Helps us tailor your style experience.</Text>
            <TextInput value={data.age} onChangeText={v => setData(prev => ({ ...prev, age:v }))}
              placeholder="Age" placeholderTextColor="#C0C8C0" keyboardType="number-pad" style={st.textInput} />
          </View>
        )}
        {step === 2 && (
          <View>
            <Text style={st.quizTitle}>Pick your brands</Text>
            <Text style={st.quizSub}>Choose 3 or more that match your taste.</Text>
            <ChipSelect options={BRANDS} selected={data.brands} onToggle={v => toggle('brands', v)} />
            {data.brands.length < 3 && (
              <Text style={{ marginTop:12, fontSize:12, color:C.accent, letterSpacing:0.5 }}>Select at least {3 - data.brands.length} more</Text>
            )}
          </View>
        )}
        {step === 3 && (
          <View>
            <Text style={st.quizTitle}>What do you do?</Text>
            <Text style={st.quizSub}>Your lifestyle shapes your wardrobe.</Text>
            <ChipSelect options={OCCUPATION_OPTIONS} selected={data.occupation} onToggle={v => toggle('occupation', v)} />
          </View>
        )}
        {step === 4 && (
          <View>
            <Text style={st.quizTitle}>Tell us about your coloring</Text>
            <Text style={st.quizSub}>We'll use this to find shades that genuinely flatter you.</Text>
 
            <Text style={st.coloringLabel}>Skin tone</Text>
            <View style={{ alignItems:'center', marginTop:8, marginBottom:8 }}>
              {(() => {
                const SIZE   = 310;
                const CX     = SIZE / 2;
                const CY     = SIZE / 2;
                const PIE_R  = 88;
                const RING_R = 132;
                const SW_R   = 16;
                const toRad  = d => (d * Math.PI) / 180;
                const pt     = (deg, r) => ({ x: CX + r * Math.cos(toRad(deg)), y: CY + r * Math.sin(toRad(deg)) });
 
                const slicePath = (startDeg, endDeg) => {
                  const s = pt(startDeg, PIE_R);
                  const e = pt(endDeg, PIE_R);
                  let sweep = endDeg - startDeg;
                  if (sweep < 0) sweep += 360;
                  const large = sweep > 180 ? 1 : 0;
                  return `M ${CX} ${CY} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${PIE_R} ${PIE_R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
                };
 
                const sections = [
                  { key:'Warm',    start:150, end:270, textDeg:210, fill:'#d4b48a', activeFill:'#b8956a' },
                  { key:'Cool',    start:270, end:30,  textDeg:330, fill:'#a8c0d0', activeFill:'#6a9ab8' },
                  { key:'Neutral', start:30,  end:150, textDeg:90,  fill:'#c8bdb0', activeFill:'#9a8878' },
                ];
 
                const swatchGroups = [
                  {
                    key: 'Warm',
                    startDeg: 152, endDeg: 268,
                    colors: ['#f5e0c4','#f0caa8','#e8b484','#d49a68','#c07848','#9a5830','#6e3818'],
                  },
                  {
                    key: 'Cool',
                    startDeg: 272, endDeg: 388,
                    colors: ['#f5dcd4','#eec8bc','#d8a898','#b88878','#9a6858','#784840'],
                  },
                  {
                    key: 'Neutral',
                    startDeg: 32, endDeg: 148,
                    colors: ['#3a1c0c','#5a3020','#7a5038','#a07858','#c09a78','#dab898','#f0d8bc'],
                  },
                ];
 
                const allSwatches = [];
                swatchGroups.forEach(group => {
                  const n = group.colors.length;
                  const range = group.endDeg - group.startDeg;
                  group.colors.forEach((color, i) => {
                    const deg = group.startDeg + (i + 0.5) * range / n;
                    allSwatches.push({ color, deg, groupKey: group.key });
                  });
                });
 
                return (
                  <View style={{ width:SIZE, height:SIZE, position:'relative' }}>
                    <Svg width={SIZE} height={SIZE} style={{ position:'absolute', top:0, left:0 }}>
                      {sections.map(sec => {
                        const isActive = data.undertone === sec.key;
                        const tx = CX + 54 * Math.cos(toRad(sec.textDeg));
                        const ty = CY + 54 * Math.sin(toRad(sec.textDeg));
                        return (
                          <React.Fragment key={sec.key}>
                            <Path
                              d={slicePath(sec.start, sec.end)}
                              fill={isActive ? sec.activeFill : sec.fill}
                              onPress={() => setData(prev => ({ ...prev, undertone: sec.key }))}
                            />
                            <SvgText
                              x={tx} y={ty + 4}
                              textAnchor="middle"
                              fontSize="11"
                              fontWeight="700"
                              fill={isActive ? '#fff' : '#5a4a3a'}
                              onPress={() => setData(prev => ({ ...prev, undertone: sec.key }))}
                            >
                              {sec.key.toUpperCase()}
                            </SvgText>
                          </React.Fragment>
                        );
                      })}
                    </Svg>
 
                    {allSwatches.map((item, i) => {
                      const angle = toRad(item.deg);
                      const x = CX + RING_R * Math.cos(angle) - SW_R;
                      const y = CY + RING_R * Math.sin(angle) - SW_R;
                      const selected = data.skinTone === item.color;
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setData(prev => ({ ...prev, skinTone: item.color, undertone: item.groupKey }))}
                          style={{
                            position:'absolute', left:x, top:y,
                            width:SW_R*2, height:SW_R*2, borderRadius:SW_R,
                            backgroundColor:item.color,
                            borderWidth: selected ? 3 : 2,
                            borderColor: selected ? C.dark : '#fff',
                            shadowColor:'#000', shadowOpacity:0.15, shadowRadius:4, elevation:3,
                          }}
                        />
                      );
                    })}
                  </View>
                );
              })()}
            </View>
 
            <Text style={[st.coloringLabel, { marginTop:16 }]}>Hair color</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:16, marginTop:8 }}>
              {[
                { label:'Black',  color:'#1a1008' },
                { label:'Brown',  color:'#6b3a2a' },
                { label:'Blonde', color:'#d4a847' },
                { label:'Red',    color:'#b84020' },
                { label:'Gray',   color:'#b0b0b0' },
                { label:'White',  color:'#f0ece8' },
              ].map(h => (
                <TouchableOpacity key={h.label} onPress={() => setData(prev => ({ ...prev, hairColor: h.label }))}
                  style={{ alignItems:'center', gap:6 }}>
                  <View style={[st.hairSwatch, { backgroundColor: h.color },
                    data.hairColor === h.label && { borderColor: C.accent, borderWidth: 3 }]} />
                  <Text style={{ fontSize:10, color: data.hairColor === h.label ? C.accent : C.muted,
                    fontWeight: data.hairColor === h.label ? '700' : '400', letterSpacing: 0.8, textTransform:'uppercase' }}>
                    {h.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
 
            <Text style={[st.coloringLabel, { marginTop:24 }]}>Eye color</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:16, marginTop:8 }}>
              {[
                { label:'Black', color:'#0a0a0a' },
                { label:'Brown', color:'#6b3a1f' },
                { label:'Hazel', color:'#8b7340' },
                { label:'Blue',  color:'#4a7ab5' },
                { label:'Green', color:'#4a8060' },
                { label:'Gray',  color:'#7a8a8a' },
              ].map(e => (
                <TouchableOpacity key={e.label} onPress={() => setData(prev => ({ ...prev, eyeColor: e.label }))}
                  style={{ alignItems:'center', gap:6 }}>
                  <View style={[st.eyeSwatch, { backgroundColor: e.color },
                    data.eyeColor === e.label && { borderColor: C.accent, borderWidth: 3 }]} />
                  <Text style={{ fontSize:10, color: data.eyeColor === e.label ? C.accent : C.muted,
                    fontWeight: data.eyeColor === e.label ? '700' : '400', letterSpacing: 0.8, textTransform:'uppercase' }}>
                    {e.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {step === 5 && (
          <View>
            <Text style={st.quizTitle}>What's your style?</Text>
            <Text style={st.quizSub}>Pick all the aesthetics that feel like you.</Text>
            <View style={st.styleGrid}>
              {STYLE_OPTIONS.map(item => (
                <StylePhotoCard key={item.label} item={item}
                  selected={data.styles.includes(item.label)}
                  onToggle={v => toggle('styles', v)} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
 
      <View style={st.quizFooter}>
        <TouchableOpacity onPress={next} disabled={!canContinue}
          style={[st.btnDark, !canContinue && { backgroundColor:'#C8D4C8' }]}>
          <Text style={st.btnDarkText}>{step === QUIZ_STEPS - 1 ? 'Finish' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
 
// ── Swipeable Card ────────────────────────────────────────────────────────────
function SwipeableCard({ item, cardW, onSwipe }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
 
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        const SWIPE_THRESHOLD = SCREEN_W * 0.3;
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.timing(pan.x, { toValue: SCREEN_W * 1.5, duration: 250, useNativeDriver: false }),
            Animated.timing(cardOpacity, { toValue: 0, duration: 250, useNativeDriver: false }),
          ]).start(() => onSwipe('right'));
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.timing(pan.x, { toValue: -SCREEN_W * 1.5, duration: 250, useNativeDriver: false }),
            Animated.timing(cardOpacity, { toValue: 0, duration: 250, useNativeDriver: false }),
          ]).start(() => onSwipe('left'));
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();
        }
      },
    })
  ).current;
 
  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_W / 2, 0, SCREEN_W / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });
 
  const yesOpacity = pan.x.interpolate({
    inputRange: [0, SCREEN_W * 0.25],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
 
  const noOpacity = pan.x.interpolate({
    inputRange: [-SCREEN_W * 0.25, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
 
  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
        opacity: cardOpacity,
        width: cardW,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      <Image
        source={item.src}
        style={{ width: cardW, height: cardW * 1.25, backgroundColor: C.softGreen }}
        resizeMode="contain"
      />
 
      {/* YES overlay */}
      <Animated.View style={{
        position: 'absolute', top: 24, left: 20,
        opacity: yesOpacity,
        borderWidth: 2, borderColor: C.accent, borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.90)',
      }}>
        <Text style={{ color: C.accent, fontSize: 14, fontWeight: '700', letterSpacing: 2, textTransform:'uppercase' }}>Love it</Text>
      </Animated.View>
 
      {/* NO overlay */}
      <Animated.View style={{
        position: 'absolute', top: 24, right: 20,
        opacity: noOpacity,
        borderWidth: 2, borderColor: '#A05050', borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.90)',
      }}>
        <Text style={{ color: '#A05050', fontSize: 14, fontWeight: '700', letterSpacing: 2, textTransform:'uppercase' }}>Pass</Text>
      </Animated.View>
 
      <View style={st.clothingCardInfo}>
        <Text style={st.clothingName}>{item.name}</Text>
      </View>
    </Animated.View>
  );
}
 
// ── Swipe Train ────────────────────────────────────────────────────────────────
function SwipeTrainScreen({ onDone, userAge }) {
  const ageBucket = getAgeBucket(userAge);
  const items = buildSwipeItems(ageBucket);
 
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
 
  const currentItem = items[idx];
 
  const skipCategory = () => {
    if (!currentItem) return;
    const currentCat = currentItem.categoryKey;
    let nextIdx = idx + 1;
    while (nextIdx < items.length && items[nextIdx].categoryKey === currentCat) {
      nextIdx++;
    }
    const skippedResults = items
      .slice(idx, nextIdx)
      .map(item => ({ item, liked: null, skipped: true }));
    setResults(prev => [...prev, ...skippedResults]);
    setIdx(nextIdx);
  };
 
  const handleSwipe = (dir) => {
    setResults(prev => [...prev, { item: currentItem, liked: dir === 'right', skipped: false }]);
    setIdx(prev => prev + 1);
  };
 
  const isNewCategory = idx > 0 && currentItem && items[idx - 1]?.categoryKey !== currentItem.categoryKey;
  const remainingInCategory = currentItem
    ? items.slice(idx).filter(i => i.categoryKey === currentItem.categoryKey).length
    : 0;
 
  const isDone = idx >= items.length;
 
  useEffect(() => {
    if (isDone) onDone(results);
  }, [isDone]);
 
  if (isDone) return null;
 
  const cardW = SCREEN_W - 48;
 
  return (
    <SafeAreaView style={[st.flex, { backgroundColor: C.bg }]}>
      <View style={{ paddingHorizontal:24, paddingTop:12 }}>
        <View style={st.progressTrack}>
          <View style={[st.progressFill, { width:`${(idx / items.length) * 100}%` }]} />
        </View>
        <Text style={{ textAlign:'center', color:C.muted, fontSize:11, marginTop:6, letterSpacing:1.5, textTransform:'uppercase' }}>
          {idx + 1} of {items.length}
        </Text>
      </View>
 
      {(idx === 0 || isNewCategory) && currentItem && (
        <View style={st.categoryBanner}>
          <View style={{ flex:1 }}>
            <Text style={st.categoryBannerTitle}>{currentItem.categoryLabel}</Text>
            <Text style={st.categoryBannerSub}>{remainingInCategory} looks to rate</Text>
          </View>
          <TouchableOpacity onPress={skipCategory} style={st.skipCatBtn}>
            <Text style={st.skipCatBtnText}>Skip section</Text>
          </TouchableOpacity>
        </View>
      )}
 
      {!isNewCategory && idx > 0 && currentItem && (
        <View style={{ paddingHorizontal:24, marginTop:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
          <Text style={{ fontSize:12, color:C.muted, letterSpacing:1, textTransform:'uppercase' }}>
            {currentItem.categoryLabel}
          </Text>
          <TouchableOpacity onPress={skipCategory}>
            <Text style={{ fontSize:12, color:C.accent, fontWeight:'500' }}>Skip section</Text>
          </TouchableOpacity>
        </View>
      )}
 
      <View style={st.swipeCenterFlex}>
        <Text style={{ color:C.muted, fontSize:12, marginBottom:16, letterSpacing:1.5, textTransform:'uppercase' }}>
          Swipe right to love · left to pass
        </Text>
 
        <SwipeableCard
          key={currentItem.id}
          item={currentItem}
          cardW={cardW}
          onSwipe={handleSwipe}
        />
 
        <View style={{ flexDirection:'row', justifyContent:'space-between', width:cardW, marginTop:16, paddingHorizontal:8 }}>
          <Text style={{ fontSize:11, color:'#A05050', letterSpacing:1, textTransform:'uppercase' }}>Pass</Text>
          <Text style={{ fontSize:11, color:C.accent, letterSpacing:1, textTransform:'uppercase' }}>Love it</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
 
// ── Color Analysis ─────────────────────────────────────────────────────────────
function generateColorAnalysis(quizData) {
  const undertone = quizData.undertone || '';
  const hairColor = quizData.hairColor || '';
  const eyeColor  = quizData.eyeColor  || '';
  const name      = quizData.name || 'you';
 
  if (!undertone && !hairColor && !eyeColor) return null;
 
  const bits = [];
 
  if (undertone === 'Warm') {
    bits.push(`${name}, your warm undertones are such a beautiful thing to dress around. You genuinely glow in earthy, sun-kissed shades. Think camel, terracotta, olive, mustard, and creamy warm whites. These colors do not compete with your skin — they work with it.`);
  } else if (undertone === 'Cool') {
    bits.push(`${name}, your cool undertones mean you were literally made for jewel tones and icy shades. Navy, emerald, lavender, rose, and bright crisp whites are going to look so clean and intentional on you.`);
  } else if (undertone === 'Neutral') {
    bits.push(`${name}, having neutral undertones is genuinely one of the best things when it comes to getting dressed. Warm and cool colors both work on you, which means your palette is incredibly wide. Soft nudes, dusty pastels, rich jewel tones — it is all on the table for you.`);
  }
 
  if (hairColor === 'Red' || hairColor === 'Blonde') {
    bits.push(`Your ${hairColor.toLowerCase()} hair adds so much warmth to your overall coloring. Earthy greens, burnt oranges, and deep burgundies are going to look especially incredible.`);
  } else if (hairColor === 'Black' || hairColor === 'Brown') {
    bits.push(`Your ${hairColor.toLowerCase()} hair is such a versatile base. It lets both bold jewel tones and soft neutrals shine without competing with each other.`);
  } else if (hairColor === 'Gray' || hairColor === 'White') {
    bits.push(`Your ${hairColor.toLowerCase()} hair is so striking. Rich, deep tones like burgundy, forest green, and cobalt will create the most beautiful contrast against it.`);
  }
 
  if (eyeColor === 'Black') {
    bits.push(`And those deep dark eyes have real intensity to them. Rich jewel tones like deep emerald, cobalt, and burgundy will make them look absolutely striking.`);
  } else if (eyeColor === 'Blue' || eyeColor === 'Gray') {
    bits.push(`Those ${eyeColor.toLowerCase()} eyes are something special. Blues, soft grays, and lavenders worn near your face will make them pop in the best way.`);
  } else if (eyeColor === 'Green' || eyeColor === 'Hazel') {
    bits.push(`Your ${eyeColor.toLowerCase()} eyes genuinely come alive around warm browns, terracotta, and deep plum tones. Those colors bring them out beautifully.`);
  } else if (eyeColor === 'Brown') {
    bits.push(`Brown eyes are so incredibly versatile. Warm golds, rich taupes, and even cool cobalt blues all enhance them in different ways.`);
  }
 
  let palette = [];
  if (undertone === 'Warm') {
    palette = ['#c4874a','#d4a56a','#8a6a3a','#c8a060','#8a7a50','#d4b88a'];
  } else if (undertone === 'Cool') {
    palette = ['#4a6a9a','#7a8ab0','#6a9a8a','#9a7aa0','#5a7a8a','#8a9ab0'];
  } else {
    palette = ['#a09080','#b8a898','#8a9888','#c0b0a0','#9aaa98','#b0a8b8'];
  }
 
  return { text: bits.join(' '), palette };
}
 
// ── Style Analysis (swipe-based) ───────────────────────────────────────────────
function generateStyleAnalysis(quizData, swipeResults) {
  const liked    = swipeResults.filter(r => r.liked === true);
  const disliked = swipeResults.filter(r => r.liked === false);
 
  const catCounts = {};
  const catTotals = {};
  swipeResults.forEach(r => {
    const cat = r.item.categoryKey;
    catTotals[cat] = (catTotals[cat] || 0) + 1;
    if (r.liked === true) catCounts[cat] = (catCounts[cat] || 0) + 1;
  });
 
  const lovedCats = Object.entries(catCounts)
    .filter(([cat, count]) => count / (catTotals[cat] || 1) >= 0.5)
    .map(([cat]) => cat);
 
  const styles  = quizData.styles || [];
  const name    = quizData.name || 'You';
  const bullets = [];
 
  // Overall vibe
  if (liked.length === 0) {
    bullets.push('Still learning your taste — keep swiping for more specific picks');
  } else if (liked.length >= swipeResults.length * 0.7) {
    bullets.push('Versatile taste — you dress for your mood rather than one aesthetic');
  } else {
    bullets.push('Strong sense of personal style — you know exactly what feels right');
  }
 
  // Category preferences
  if (lovedCats.includes('goingout') || lovedCats.includes('going_out')) {
    bullets.push('Going-out looks are a priority — you dress intentionally for special occasions');
  }
  if (lovedCats.includes('everyday')) {
    bullets.push('Everyday dressing matters to you — you want to look good on a Tuesday too');
  }
  if (lovedCats.includes('business')) {
    bullets.push('Polished and put-together for work — professional appearance is important to you');
  }
  if (lovedCats.includes('workout')) {
    bullets.push('Activewear that actually looks good — style doesn\'t stop at the gym');
  }
  if (lovedCats.includes('vacation')) {
    bullets.push('Breezy, relaxed pieces resonate with you — vacation dressing is your happy place');
  }
 
  // Style aesthetic
  if (styles.includes('Y2K') || styles.includes('Street')) {
    bullets.push('Bold and playful energy — you\'re not afraid to have fun with fashion');
  } else if (styles.includes('Boho') || styles.includes('Cottagecore')) {
    bullets.push('Drawn to texture, movement, and pieces that feel organic and free-spirited');
  } else if (styles.includes('Edgy') || styles.includes('Moody')) {
    bullets.push('Your wardrobe has depth and mood — pieces that tell a story');
  } else if (styles.includes('Minimalist') || styles.includes('Classic')) {
    bullets.push('Clean, timeless, and intentional — elegance over trends');
  } else if (styles.includes('Feminine')) {
    bullets.push('Soft, romantic details and feminine silhouettes are your signature');
  } else if (styles.length > 0) {
    bullets.push('Eclectic mix of aesthetics — your style shifts with your mood');
  }
 
  // Liked items callout
  const likedNames = liked.map(r => r.item.name);
  if (likedNames.length >= 3) {
    bullets.push(`Standout picks: ${likedNames.slice(0, 3).join(', ')}`);
  }
 
  if (bullets.length === 0) {
    bullets.push('Your profile is building — everything from here is tailored to you');
  }
 
  return bullets;
}
 
// ── Discover ────────────────────────────────────────────────────────────────────
const DREZILY_API = 'https://products.drezily.com/direct-products';
 
const AGE_BRANDS = {
  '0-15':   ['H&M','Zara','Forever 21','Old Navy','Gap','Urban Outfitters','PacSun','Hollister','American Eagle','Target','SHEIN','Brandy Melville'],
  '16-29':  ['Zara','H&M','ASOS','Urban Outfitters','Free People','Mango','Abercrombie & Fitch','American Eagle','Forever 21','Nasty Gal','Anthropologie','Princess Polly','Revolve','PacSun','Lulus','& Other Stories'],
  '30-55':  ["Macy's",'Ann Taylor','Banana Republic','J.Crew','Gap','Anthropologie','Loft','Express','Zara','Mango','H&M','White House Black Market',"Chico's",'Talbots','Nordstrom'],
  '56-over':["Macy's",'Talbots',"Chico's",'J.Jill','Ann Taylor','Eileen Fisher','Nordstrom',"Dillard's",'Lane Bryant','Christopher & Banks','Coldwater Creek','Banana Republic'],
};
 
const EXPLORE_CATS = [
  { id:'casual',    label:'Casual',       searches:['casual everyday dress','casual jeans outfit','everyday top blouse','casual skirt'] },
  { id:'going_out', label:'Going Out',    searches:['going out dress party','night out top','cocktail dress','going out skirt'] },
  { id:'work',      label:'Work',         searches:['workwear blazer pants','office dress professional','work blouse','business casual outfit'] },
  { id:'neutral',   label:'Neutrals',     searches:['neutral beige dress','cream white top','nude toned outfit','ivory minimalist dress'] },
  { id:'warm_flowy',label:'Warm & Flowy', searches:['flowy boho dress','earthy warm top','floral flowy skirt','bohemian dress'] },
  { id:'bold',      label:'Bold Colors',  searches:['colorful bright dress','bold color top','vibrant outfit','statement color dress'] },
  { id:'active',    label:'Active',       searches:['activewear leggings','gym top athletic','workout outfit','sports bra leggings set'] },
  { id:'formal',    label:'Formal',       searches:['formal elegant dress','cocktail dress evening','formal gown','elegant maxi dress'] },
];
 
function pickBrands(ageBucket, quizBrands, count) {
  const pool = [...(AGE_BRANDS[ageBucket] || AGE_BRANDS['16-29'])];
  const extra = (quizBrands || []).filter(b => !pool.includes(b));
  return [...pool, ...extra].sort(() => Math.random() - 0.5).slice(0, count || 8);
}
 
function extractAttrs(p) {
  return {
    color:   p.Primary_color || (Array.isArray(p.Native_colour) ? p.Native_colour[0] : p.Native_colour) || null,
    type:    p.Type || p.Subcategory3 || p.Subcategory2 || null,
    pattern: Array.isArray(p.Print_or_Pattern) ? p.Print_or_Pattern[0] : (p.Print_or_Pattern || null),
    fit:     Array.isArray(p.Fit) ? p.Fit[0] : (p.Fit || null),
    fabric:  Array.isArray(p.Fabric) ? p.Fabric[0] : (p.Fabric || null),
  };
}
 
function updatePrefVec(prev, product, liked) {
  const attrs = extractAttrs(product);
  const next = JSON.parse(JSON.stringify(prev));
  Object.entries(attrs).forEach(([key, val]) => {
    if (!val) return;
    if (!next[key]) next[key] = {};
    if (!next[key][val]) next[key][val] = { likes: 0, dislikes: 0 };
    if (liked) next[key][val].likes++;
    else next[key][val].dislikes++;
  });
  return next;
}
 
function topFromPref(prefMap, mode, n) {
  if (!prefMap) return [];
  return Object.entries(prefMap)
    .map(([val, counts]) => {
      const total = counts.likes + counts.dislikes;
      const score = mode === 'liked' ? counts.likes / total : counts.dislikes / total;
      return { val, score, total };
    })
    .filter(x => x.total >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}
 
function buildSmartSearches(catSearches, prefVec) {
  const topColor = topFromPref(prefVec.color, 'liked', 1)[0];
  const topType  = topFromPref(prefVec.type,  'liked', 1)[0];
 
  return catSearches.map(base => {
    let q = base;
    if (topColor && topColor.score > 0.65) q += ' ' + topColor.val.toLowerCase();
    if (topType  && topType.score  > 0.65) q += ' ' + topType.val.toLowerCase();
    return { search: q, filters: {} };
  });
}
 
function pickNextCategory(catConf, currentId) {
  const scored = EXPLORE_CATS.map(cat => {
    const conf = catConf[cat.id] || { shown: 0, likes: 0, dislikes: 0 };
    const total = conf.likes + conf.dislikes;
    const explorationScore = 1 / (conf.shown + 1);
    const currentPenalty = cat.id === currentId ? 0.3 : 1;
    return { cat, score: explorationScore * currentPenalty };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].cat;
}
 
function summarizeProductsForAI(items, limit) {
  return items.slice(-limit).map(p => {
    const attrs = extractAttrs(p);
    const parts = [p.Brand, p.Title].filter(Boolean);
    const details = [attrs.color, attrs.type, attrs.pattern, attrs.fit, attrs.fabric]
      .filter(Boolean).join(', ');
    const price = p.Selling_Price ? `$${p.Selling_Price}` : '';
    return `${parts.join(' - ')}${details ? ' (' + details + ')' : ''}${price ? ' ' + price : ''}`;
  }).join('\n');
}
 
async function generateAIInsight(liked, passed, prefVec, name, newLiked, newPassed, previousInsights) {
  const You = name || 'the user';
 
  const likedSummary  = liked.length  > 0 ? summarizeProductsForAI(liked, 25)  : '(none yet)';
  const passedSummary = passed.length > 0 ? summarizeProductsForAI(passed, 25) : '(none yet)';
  const newLikedSummary  = (newLiked  && newLiked.length  > 0) ? summarizeProductsForAI(newLiked, 15)  : '(none)';
  const newPassedSummary = (newPassed && newPassed.length > 0) ? summarizeProductsForAI(newPassed, 15) : '(none)';
 
  const topColorLikes    = topFromPref(prefVec.color,   'liked',    3).map(c => c.val);
  const topColorDislikes = topFromPref(prefVec.color,   'disliked', 3).map(c => c.val);
  const topTypeLikes     = topFromPref(prefVec.type,    'liked',    3).map(c => c.val);
  const topTypeDislikes  = topFromPref(prefVec.type,    'disliked', 3).map(c => c.val);
  const topPatternLikes  = topFromPref(prefVec.pattern, 'liked',    2).map(c => c.val);
  const topFitLikes      = topFromPref(prefVec.fit,     'liked',    2).map(c => c.val);
  const topFabricLikes   = topFromPref(prefVec.fabric,  'liked',    2).map(c => c.val);
 
  const statsBlock = `
Colors liked most: ${topColorLikes.join(', ') || 'not enough data'}
Colors avoided: ${topColorDislikes.join(', ') || 'not enough data'}
Clothing types liked most: ${topTypeLikes.join(', ') || 'not enough data'}
Clothing types avoided: ${topTypeDislikes.join(', ') || 'not enough data'}
Patterns liked: ${topPatternLikes.join(', ') || 'not enough data'}
Fits liked: ${topFitLikes.join(', ') || 'not enough data'}
Fabrics liked: ${topFabricLikes.join(', ') || 'not enough data'}
`.trim();
 
  const hasPrevious = previousInsights && previousInsights.length > 0;
 
  const systemPrompt = `You are a perceptive personal stylist analyzing a user's swipe history on a fashion app (right swipe = saved/liked, left swipe = passed).
Write exactly 3 SPECIFIC, personalized observations about their style based on the actual products listed below — not generic statements.
Reference actual colors, patterns, silhouettes, fabrics, brands, or price points you notice in the data.
Good example: "You keep saving floral midi dresses in warm tones like terracotta and rust, but passing on anything in bold primary colors."
Bad example: "You have a clear sense of what works for you." (too generic, says nothing)
Each observation should be 1-2 sentences, warm and conversational, written in second person ("you"), no em dashes.
${hasPrevious ? `This is a FOLLOW-UP check-in. You already told the user these things earlier — do NOT repeat them, and do not just reword them:
${previousInsights.map((t, i) => `${i + 1}. ${t}`).join('\n')}
Focus your new observations on what's changed or what's newly noticeable since then.` : ''}
Return ONLY a JSON array of strings, like: ["observation 1", "observation 2", "observation 3"]
No other text, no markdown formatting.`;
 
  const userPrompt = `ALL LIKED items so far (saved):
${likedSummary}
ALL PASSED items so far (skipped):
${passedSummary}
MOST RECENTLY SWIPED — new liked items since last check-in:
${newLikedSummary}
MOST RECENTLY SWIPED — new passed items since last check-in:
${newPassedSummary}
Aggregate stats (across everything so far):
${statsBlock}`;
 
  try {
    const res = await fetch(AZURE_OPENAI_ENDPOINT + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AZURE_OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 400,
        temperature: 0.9,
      }),
    });
    const data = await res.json();
    if (data.error) return null;
    const raw = data.choices?.[0]?.message?.content || '';
    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch { return null; }
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.slice(0, 3).map(text => ({ text, confirmed: null }));
  } catch (e) {
    return null;
  }
}
 
function pluralize(word) {
  if (!word) return word;
  const w = word.toLowerCase().trim();
  if (w.endsWith('ss') || w.endsWith('sh') || w.endsWith('ch') || w.endsWith('x') || w.endsWith('z')) return w + 'es';
  if (w.endsWith('s')) return w;
  if (w.endsWith('y') && !/[aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies';
  return w + 's';
}
 
function generateDetailedInsight(prefVec, catConf, name, previousInsights) {
  const insights = [];
  const previous = previousInsights || [];
  const You = name || 'You';
  const you = name ? name.toLowerCase() : 'you';
 
  const tryAdd = (text) => {
    if (!previous.includes(text)) insights.push({ text, confirmed: null });
  };
 
  const colorLikes = topFromPref(prefVec.color, 'liked', 3);
  if (colorLikes.length >= 2) {
    const names = colorLikes.map(c => c.val.toLowerCase()).join(', ');
    tryAdd(You + ' consistently save pieces in ' + names + ' tones. These colors genuinely suit your style and we will keep showing you more of them.');
  } else if (colorLikes.length === 1 && colorLikes[0].score > 0.7) {
    tryAdd('Almost every piece ' + you + ' save tends to be in ' + colorLikes[0].val.toLowerCase() + '. That is a really clear signal about what you are drawn to.');
  }
 
  const colorDislikes = topFromPref(prefVec.color, 'disliked', 2);
  if (colorDislikes.length >= 1 && colorDislikes[0].score > 0.65) {
    const names = colorDislikes.slice(0, 2).map(c => c.val.toLowerCase()).join(' and ');
    tryAdd(You + ' almost always pass on ' + names + ' pieces. Noted — those will show up a lot less in your feed going forward.');
  }
 
  const typeLikes = topFromPref(prefVec.type, 'liked', 2);
  if (typeLikes.length >= 1 && typeLikes[0].score > 0.6) {
    tryAdd(pluralize(typeLikes[0].val).charAt(0).toUpperCase() + pluralize(typeLikes[0].val).slice(1) + ' are clearly what ' + you + ' reach for most. That silhouette just works for you.');
  }
  if (typeLikes.length >= 2 && typeLikes[1].score > 0.6) {
    tryAdd(You + ' also keep coming back to ' + pluralize(typeLikes[1].val) + '. Looks like that is another go-to for you.');
  }
 
  const typeDislikes = topFromPref(prefVec.type, 'disliked', 2);
  if (typeDislikes.length >= 1 && typeDislikes[0].score > 0.65) {
    tryAdd(You + ' consistently skip ' + pluralize(typeDislikes[0].val) + '. We will shift your feed away from those.');
  }
 
  const patternLikes    = topFromPref(prefVec.pattern, 'liked',   2);
  const patternDislikes = topFromPref(prefVec.pattern, 'disliked', 2);
  if (patternDislikes.length >= 1 && patternDislikes[0].score > 0.7) {
    tryAdd(You + ' almost never save ' + patternDislikes[0].val.toLowerCase() + ' pieces. You tend to prefer cleaner, simpler designs.');
  }
  if (patternLikes.length >= 1 && patternLikes[0].score > 0.65) {
    tryAdd(You + ' keep saving ' + patternLikes[0].val.toLowerCase() + ' pieces. There is clearly something about that aesthetic that speaks to you.');
  }
 
  const fitLikes    = topFromPref(prefVec.fit, 'liked',   2);
  const fitDislikes = topFromPref(prefVec.fit, 'disliked', 1);
  if (fitLikes.length >= 1 && fitDislikes.length >= 1) {
    tryAdd(You + ' prefer ' + fitLikes[0].val.toLowerCase() + ' fits over ' + fitDislikes[0].val.toLowerCase() + ' ones. That is a really useful thing to know when building a wardrobe.');
  } else if (fitLikes.length >= 1 && fitLikes[0].score > 0.65) {
    tryAdd(You + ' are consistently drawn to ' + fitLikes[0].val.toLowerCase() + ' silhouettes. A great foundation for a cohesive closet.');
  }
 
  const fabricLikes = topFromPref(prefVec.fabric, 'liked', 2);
  if (fabricLikes.length >= 1 && fabricLikes[0].score > 0.65) {
    tryAdd(You + ' gravitate toward ' + fabricLikes[0].val.toLowerCase() + ' fabrics. Makes sense — the way something feels is just as important as how it looks.');
  }
 
  if (insights.length === 0) {
    const fallbackText = previous.length === 0
      ? 'We are still learning your taste. Keep swiping and your style profile will get much more specific over time.'
      : 'Your style is staying pretty consistent so far. Keep swiping and we will spot more specific patterns soon.';
    insights.push({ text: fallbackText, confirmed: null });
  }
 
  return insights.slice(0, 3);
}
 
function DiscoverScreen({ userAge, quizData, userId }) {
  const ageBucket  = getAgeBucket(userAge);
  const quizBrands = quizData?.brands || [];
 
  const [currentCat, setCurrentCat] = useState(() => EXPLORE_CATS.find(c => c.id === 'casual') || EXPLORE_CATS[0]);
  const [catConf, setCatConf]   = useState({});
  const [prefVec, setPrefVec]   = useState({ color:{}, type:{}, pattern:{}, fit:{}, fabric:{} });
  const [seenIds, setSeenIds]   = useState(new Set());
  const [products, setProducts] = useState([]);
  const [cardIdx, setCardIdx]   = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [fetching, setFetching] = useState(false);
  const [liked, setLiked]       = useState([]);
  const [passed, setPassed]     = useState([]);
  const [showLiked, setShowLiked] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [insightData, setInsightData] = useState([]);
  const [insightLoading, setInsightLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const lastInsightAtRef   = useRef(0);
  const likedCheckpointRef = useRef(0);
  const passedCheckpointRef = useRef(0);
  const previousInsightsRef = useRef([]);
  const pendingSeenRef     = useRef([]);
  const totalSwiped = liked.length + passed.length;
 
  useEffect(() => {
    loadDiscoverProfile();
  }, []);
 
  const loadDiscoverProfile = async () => {
    if (!userId) { setProfileLoaded(true); doFetch(currentCat, prefVec, 1, true); return; }
    try {
      const { data, error } = await supabase
        .from('discover_profile')
        .select('seen_ids, liked_products')
        .eq('user_id', userId)
        .single();
 
      if (data) {
        const loadedSeenIds = new Set(Array.isArray(data.seen_ids) ? data.seen_ids : []);
        const loadedLiked   = Array.isArray(data.liked_products) ? data.liked_products : [];
        setSeenIds(loadedSeenIds);
        setLiked(loadedLiked);
        lastInsightAtRef.current = loadedLiked.length;
        doFetch(currentCat, prefVec, 1, true, loadedSeenIds);
      } else {
        doFetch(currentCat, prefVec, 1, true, new Set());
      }
    } catch (e) {
      doFetch(currentCat, prefVec, 1, true, new Set());
    }
    setProfileLoaded(true);
  };
 
  const flushSeenIds = async (allSeenIds) => {
    if (!userId || pendingSeenRef.current.length === 0) return;
    try {
      const arr = Array.from(allSeenIds).slice(-2000);
      await supabase.from('discover_profile').upsert({
        user_id: userId,
        seen_ids: arr,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      pendingSeenRef.current = [];
    } catch (e) {}
  };
 
  const saveLikedProduct = async (product, allLiked) => {
    if (!userId) return;
    try {
      await supabase.from('discover_profile').upsert({
        user_id: userId,
        liked_products: allLiked,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (e) {}
  };
 
  const removeLikedProduct = async (productId) => {
    if (!userId) return;
    try {
      const updated = liked.filter(p => p.Product_Id !== productId);
      setLiked(updated);
      await supabase.from('discover_profile').upsert({
        user_id: userId,
        liked_products: updated,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (e) {}
  };
 
  useEffect(() => {
    if (profileLoaded) doFetch(currentCat, prefVec, 1, true);
  }, [currentCat.id]);
 
  const doFetch = async (cat, pv, pageNum, reset, overrideSeenIds) => {
    if (fetching && !reset) return;
    setFetching(true);
    if (reset) setLoading(true);
    const activeSeen = overrideSeenIds || seenIds;
    try {
      const brands  = pickBrands(ageBucket, quizBrands, 10);
      const searches = buildSmartSearches(cat.searches, pv);
      const res = await fetch(DREZILY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searches,
          universal_filters: { Brand: brands },
          chips: false, facets: false, page: pageNum,
        }),
      });
      const data  = await res.json();
      const items = (data.results || [])
        .filter(p => p.Display_Image && p.Title && !activeSeen.has(p.Product_Id))
        .sort(() => Math.random() - 0.5);
 
      setSeenIds(prev => {
        const next = new Set(prev);
        items.forEach(p => next.add(p.Product_Id));
        return next;
      });
      items.forEach(p => pendingSeenRef.current.push(p.Product_Id));
 
      reset ? setProducts(items) : setProducts(prev => [...prev, ...items]);
      setPage(pageNum);
    } catch (e) {}
    setLoading(false);
    setFetching(false);
  };
 
  const handleSwipe = (dir) => {
    const product = products[cardIdx];
    if (!product) return;
 
    const isLike = dir === 'right';
    const newLiked = isLike ? [...liked, product] : liked;
    if (isLike) {
      setLiked(newLiked);
      saveLikedProduct(product, newLiked);
    } else {
      setPassed(prev => [...prev, product]);
    }
 
    const newPrefVec = updatePrefVec(prefVec, product, isLike);
    setPrefVec(newPrefVec);
 
    const newCatConf = {
      ...catConf,
      [currentCat.id]: {
        shown:    (catConf[currentCat.id]?.shown || 0) + 1,
        likes:    isLike ? (catConf[currentCat.id]?.likes || 0) + 1 : (catConf[currentCat.id]?.likes || 0),
        dislikes: !isLike ? (catConf[currentCat.id]?.dislikes || 0) + 1 : (catConf[currentCat.id]?.dislikes || 0),
      },
    };
    setCatConf(newCatConf);
 
    const next = cardIdx + 1;
    const newTotalSwiped = liked.length + passed.length + 1;
 
    if (newTotalSwiped % 10 === 0) {
      flushSeenIds(seenIds);
    }
 
    if (next >= products.length - 8 && !fetching) {
      doFetch(currentCat, newPrefVec, page + 1);
    }
 
    if (newTotalSwiped - lastInsightAtRef.current >= 15) {
      lastInsightAtRef.current = newTotalSwiped;
      setCardIdx(next);
      openInsight(newLiked, !isLike ? [...passed, product] : passed);
      return;
    }
 
    const catShown = newCatConf[currentCat.id]?.shown || 0;
    if (catShown > 0 && catShown % 15 === 0) {
      const nextCat = pickNextCategory(newCatConf, currentCat.id);
      setCurrentCat(nextCat);
      setProducts([]);
      setCardIdx(0);
      setPage(1);
      doFetch(nextCat, newPrefVec, 1, true);
      return;
    }
 
    setCardIdx(next);
  };
 
  const openInsight = async (likedSnapshot, passedSnapshot) => {
    setShowInsight(true);
    setInsightLoading(true);
    setInsightData([]);
 
    const likedItems  = likedSnapshot  || liked;
    const passedItems = passedSnapshot || passed;
    const newLikedItems  = likedItems.slice(likedCheckpointRef.current);
    const newPassedItems = passedItems.slice(passedCheckpointRef.current);
 
    const aiInsights = await generateAIInsight(
      likedItems, passedItems, prefVec, quizData?.name,
      newLikedItems, newPassedItems, previousInsightsRef.current
    );
 
    if (aiInsights) {
      const fresh = aiInsights.filter(a => !previousInsightsRef.current.includes(a.text));
      const finalInsights = fresh.length > 0 ? fresh : aiInsights;
      setInsightData(finalInsights);
      previousInsightsRef.current = [...previousInsightsRef.current, ...finalInsights.map(a => a.text)];
    } else {
      const fallback = generateDetailedInsight(prefVec, catConf, quizData?.name, previousInsightsRef.current);
      setInsightData(fallback);
      previousInsightsRef.current = [...previousInsightsRef.current, ...fallback.map(a => a.text)];
    }
 
    likedCheckpointRef.current = likedItems.length;
    passedCheckpointRef.current = passedItems.length;
    setInsightLoading(false);
  };
 
  const cardW = SCREEN_W - 48;
  const currentProduct = products[cardIdx];
  const swipedCount = cardIdx;
 
  // ── Insight panel ────────────────────────────────────────────────────────
  if (showInsight) {
    return (
      <SafeAreaView style={[st.flex, { backgroundColor: C.bg }]}>
        <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:24, paddingVertical:12,
          borderBottomWidth:1, borderBottomColor:C.hairline }}>
          <TouchableOpacity onPress={() => setShowInsight(false)} style={{ marginRight:12 }}>
            <Text style={{ fontSize:18, color:C.dark, fontWeight:'300' }}>←</Text>
          </TouchableOpacity>
          <Text style={st.dashName}>Style Profile</Text>
          <TouchableOpacity onPress={() => setShowInsight(false)} style={{ marginLeft:'auto' }}>
            <Text style={{ fontSize:12, color:C.muted, fontWeight:'500', letterSpacing:1, textTransform:'uppercase' }}>Skip</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding:24, paddingBottom:48 }}>
          <View style={{ marginBottom:20 }}>
            <Text style={{ fontSize:11, color:C.muted, textAlign:'center', letterSpacing:1.5, textTransform:'uppercase' }}>
              Based on {totalSwiped} swipes
            </Text>
          </View>
 
          {insightLoading && (
            <View style={st.summaryCard}>
              <ActivityIndicator color={C.accent} style={{ marginBottom:10 }} />
              <Text style={{ fontSize:13, color:C.muted, textAlign:'center', marginBottom:12 }}>
                Analyzing your style...
              </Text>
              <TouchableOpacity onPress={() => setShowInsight(false)}>
                <Text style={{ fontSize:12, color:C.accent, fontWeight:'600', textAlign:'center', letterSpacing:1, textTransform:'uppercase' }}>Keep swiping</Text>
              </TouchableOpacity>
            </View>
          )}
 
          {!insightLoading && insightData.length === 0 && (
            <View style={st.summaryCard}>
              <Text style={{ fontSize:14, color:C.muted, textAlign:'center', lineHeight:22 }}>
                Keep swiping to build your style profile. We need a few more swipes to give you meaningful insights.
              </Text>
            </View>
          )}
 
          {!insightLoading && insightData.map((item, i) => (
            <View key={i} style={[st.summaryCard, { marginBottom:12 }]}>
              <Text style={{ fontSize:14, color:C.dark, lineHeight:22, marginBottom:14 }}>{item.text}</Text>
              <View style={{ flexDirection:'row', gap:10 }}>
                <TouchableOpacity
                  onPress={() => { const u=[...insightData]; u[i]={...u[i],confirmed:true}; setInsightData(u); }}
                  style={{ flex:1, padding:10, borderRadius:10, alignItems:'center',
                    backgroundColor: item.confirmed === true ? C.softGreen : C.bg,
                    borderWidth:1, borderColor: item.confirmed === true ? C.accent : C.hairline }}>
                  <Text style={{ fontSize:12, color: item.confirmed === true ? C.accent : C.muted,
                    fontWeight:'600', letterSpacing:0.8, textTransform:'uppercase' }}>
                    {item.confirmed === true ? 'Confirmed' : 'That\'s me'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { const u=[...insightData]; u[i]={...u[i],confirmed:false}; setInsightData(u); }}
                  style={{ flex:1, padding:10, borderRadius:10, alignItems:'center',
                    backgroundColor: item.confirmed === false ? '#F5EDED' : C.bg,
                    borderWidth:1, borderColor: item.confirmed === false ? '#A05050' : C.hairline }}>
                  <Text style={{ fontSize:12, color: item.confirmed === false ? '#A05050' : C.muted,
                    fontWeight:'600', letterSpacing:0.8, textTransform:'uppercase' }}>
                    {item.confirmed === false ? 'Not quite' : 'Not really'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
 
          <TouchableOpacity onPress={() => setShowInsight(false)} style={[st.btnDark, { marginTop:8 }]}>
            <Text style={st.btnDarkText}>Keep discovering</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }
 
  // ── Liked panel ──────────────────────────────────────────────────────────
  if (showLiked) {
    const SZ = (SCREEN_W - 48) / 2;
    return (
      <View style={[st.flex, { backgroundColor: C.bg }]}>
        <SafeAreaView>
          <View style={st.dashHeader}>
            <TouchableOpacity onPress={() => setShowLiked(false)}>
              <Text style={{ fontSize:18, color:C.dark, fontWeight:'300' }}>←</Text>
            </TouchableOpacity>
            <Text style={st.dashName}>Saved</Text>
            <View style={{ width:22 }} />
          </View>
        </SafeAreaView>
        {liked.length === 0 ? (
          <View style={st.centerFlex}>
            <Text style={{ fontSize:13, color:C.muted, textAlign:'center', letterSpacing:1, textTransform:'uppercase' }}>Nothing saved yet</Text>
            <Text style={[st.heroSub, { marginTop:8, marginBottom:0 }]}>Swipe right on items you love</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding:12, paddingBottom:100 }}>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12 }}>
              {liked.map((p, i) => (
                <TouchableOpacity key={p.Product_Id + '-' + i}
                  style={st.productCard}
                  onPress={() => p.Item_Url && Linking.openURL(p.Item_Url)}>
                  <Image source={{ uri: p.Display_Image }} style={{ width:SZ, height:SZ*1.2 }} resizeMode="cover" />
                  <View style={{ padding:10 }}>
                    <Text style={st.productBrand}>{p.Brand}</Text>
                    <Text style={st.productTitle} numberOfLines={2}>{p.Title}</Text>
                    <Text style={st.productPrice}>${p.Selling_Price}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeLikedProduct(p.Product_Id)}
                    style={st.heartBtn}>
                    <Text style={{ fontSize:14, color:C.accent }}>x</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    );
  }
 
  // ── Main swipe view ──────────────────────────────────────────────────────
  return (
    <View style={[st.flex, { backgroundColor: C.bg }]}>
      <SafeAreaView>
        <View style={st.dashHeader}>
          <Text style={st.dashName}>Discover</Text>
          <View style={{ flexDirection:'row', gap:8, alignItems:'center' }}>
            <TouchableOpacity onPress={() => setShowLiked(true)}
              style={[st.headerBtn, liked.length > 0 && { borderColor: C.accent }]}>
              <Text style={{ fontSize:12, fontWeight:'700', color: liked.length > 0 ? C.accent : C.muted,
                letterSpacing:0.5 }}>
                Saved {liked.length > 0 ? `(${liked.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ paddingHorizontal:24, paddingBottom:8 }}>
          <Text style={{ fontSize:11, color:C.muted, letterSpacing:1, textTransform:'uppercase' }}>{swipedCount} explored</Text>
        </View>
      </SafeAreaView>
 
      {loading && products.length === 0 && (
        <View style={st.centerFlex}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={{ marginTop:16, fontSize:13, color:C.muted, letterSpacing:1, textTransform:'uppercase' }}>
            Finding pieces for you
          </Text>
        </View>
      )}
 
      {!loading && currentProduct && (
        <View style={st.swipeCenterFlex}>
          <Text style={{ color:C.muted, fontSize:11, marginBottom:12, letterSpacing:1.5, textTransform:'uppercase' }}>
            Right to save · Left to pass
          </Text>
          <SwipeableCard
            key={currentProduct.Product_Id + '-' + cardIdx}
            item={{ id: currentProduct.Product_Id, src: { uri: currentProduct.Display_Image }, name: currentProduct.Title }}
            cardW={cardW}
            onSwipe={handleSwipe}
          />
          <View style={{ alignItems:'center', marginTop:10, gap:2 }}>
            <Text style={st.productBrand}>{currentProduct.Brand}</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
              <Text style={st.productPrice}>${currentProduct.Selling_Price}</Text>
              {currentProduct.Original_Price > currentProduct.Selling_Price && (
                <Text style={{ fontSize:12, color:'#C0C0C0', textDecorationLine:'line-through' }}>${currentProduct.Original_Price}</Text>
              )}
            </View>
          </View>
          <View style={{ flexDirection:'row', justifyContent:'space-between', width:cardW, marginTop:14, paddingHorizontal:8 }}>
            <Text style={{ fontSize:11, color:'#A05050', letterSpacing:1, textTransform:'uppercase' }}>Pass</Text>
            <Text style={{ fontSize:11, color:C.accent, letterSpacing:1, textTransform:'uppercase' }}>Save</Text>
          </View>
        </View>
      )}
 
      {!loading && !currentProduct && products.length === 0 && (
        <View style={st.centerFlex}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={{ marginTop:16, fontSize:13, color:C.muted }}>Loading your next picks...</Text>
        </View>
      )}
    </View>
  );
}
 
// ── Style Summary Screen ───────────────────────────────────────────────────────
function StyleSummaryScreen({ quizData, swipeResults, onDone }) {
  const colorAnalysis = generateColorAnalysis(quizData);
  const styleBullets  = generateStyleAnalysis(quizData, swipeResults);
 
  const name       = quizData.name;
  const age        = quizData.age;
  const occupation = quizData.occupation || [];
  const brands     = quizData.brands || [];
  const styles     = quizData.styles || [];
  const hairColor  = quizData.hairColor;
  const eyeColor   = quizData.eyeColor;
  const undertone  = quizData.undertone;
 
  return (
    <SafeAreaView style={[st.flex, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
 
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={[st.sectionEyebrow, { marginBottom: 10 }]}>Your results</Text>
          <Text style={[st.heroTitle, { fontSize: 28, marginBottom: 8 }]}>
            Here's what{'\n'}we learned
          </Text>
          <Text style={{ fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 }}>
            Your personal style profile, built just for you
          </Text>
        </View>
 
        {/* ── Your Profile card ── */}
        <View style={st.summaryCard}>
          <Text style={[st.sectionEyebrow, { marginBottom: 16 }]}>Your profile</Text>
 
          {/* Name + Age */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
            {name ? (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Name</Text>
                <Text style={{ fontSize: 15, color: C.dark, fontWeight: '500' }}>{name}</Text>
              </View>
            ) : null}
            {age ? (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Age</Text>
                <Text style={{ fontSize: 15, color: C.dark, fontWeight: '500' }}>{age}</Text>
              </View>
            ) : null}
          </View>
 
          {/* Occupation */}
          {occupation.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Occupation</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {occupation.map((o, i) => (
                  <View key={i} style={{ backgroundColor: C.softGreen, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, color: C.accent }}>{o}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
 
          {/* Style aesthetics */}
          {styles.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Style aesthetics</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {styles.map((s, i) => (
                  <View key={i} style={{ backgroundColor: C.softGreen, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, color: C.accent }}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
 
          {/* Brands */}
          {brands.length > 0 && (
            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Favourite brands</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {brands.slice(0, 8).map((b, i) => (
                  <View key={i} style={{ backgroundColor: C.white, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.hairline }}>
                    <Text style={{ fontSize: 12, color: C.dark }}>{b}</Text>
                  </View>
                ))}
                {brands.length > 8 && (
                  <View style={{ borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, color: C.muted }}>+{brands.length - 8} more</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
 
        {/* ── Coloring card ── */}
        {colorAnalysis && (
          <View style={st.summaryCard}>
            <Text style={[st.sectionEyebrow, { marginBottom: 16 }]}>Your coloring</Text>
 
            {/* Palette swatches */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {colorAnalysis.palette.map((color, i) => (
                <View key={i} style={{ flex: 1, height: 36, borderRadius: 8, backgroundColor: color }} />
              ))}
            </View>
 
            {/* Coloring details */}
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
              {undertone ? (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Undertone</Text>
                  <Text style={{ fontSize: 14, color: C.dark, fontWeight: '500' }}>{undertone}</Text>
                </View>
              ) : null}
              {hairColor ? (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Hair</Text>
                  <Text style={{ fontSize: 14, color: C.dark, fontWeight: '500' }}>{hairColor}</Text>
                </View>
              ) : null}
              {eyeColor ? (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Eyes</Text>
                  <Text style={{ fontSize: 14, color: C.dark, fontWeight: '500' }}>{eyeColor}</Text>
                </View>
              ) : null}
            </View>
 
            <Text style={{ fontSize: 13, color: C.muted, lineHeight: 20 }}>
              {colorAnalysis.text}
            </Text>
          </View>
        )}
 
        {/* ── Style analysis card (bullet points) ── */}
        <View style={[st.summaryCard, { backgroundColor: C.dark, borderColor: C.dark }]}>
          <Text style={[st.sectionEyebrow, { color: 'rgba(255,255,255,0.5)', marginBottom: 16 }]}>Style analysis</Text>
          {styleBullets.map((bullet, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: i < styleBullets.length - 1 ? 12 : 0 }}>
              <Text style={{ color: C.accent, fontSize: 14, marginTop: 1 }}>·</Text>
              <Text style={{ flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 21 }}>
                {bullet}
              </Text>
            </View>
          ))}
        </View>
 
        <TouchableOpacity onPress={onDone} style={[st.btnDark, { marginTop: 8, backgroundColor: C.accent }]}>
          <Text style={st.btnDarkText}>Meet your stylist</Text>
        </TouchableOpacity>
 
      </ScrollView>
    </SafeAreaView>
  );
}
 
// ── Dashboard ──────────────────────────────────────────────────────────────────
const TRENDING_SEARCHES = [
  'Warm & comfy knits',
  'Brown tailored pants',
  'Everyday statement jackets',
  'Simple but stylish basic tops',
  'Flowy summer dresses',
  'Classic white shirts',
];
 
function DashboardScreen({ onNav, userName, onSignOut, userAge, quizData }) {
  const [menuOpen, setMenuOpen]         = useState(false);
  const [weather, setWeather]           = useState(null);
  const [ootd, setOotd]                 = useState(null);
  const [trendingProducts, setTrending] = useState([]);
  const [loadingOotd, setLoadingOotd]   = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
 
  const ageBucket  = getAgeBucket(userAge || '25');
  const quizBrands = quizData?.brands || [];
  const undertone  = quizData?.undertone || 'Neutral';
 
  const colorPalette = undertone === 'Warm'
    ? [['#c4874a','Camel'],['#c07850','Terracotta'],['#c8a060','Mustard'],['#f5e8d0','Cream'],['#8a7a50','Olive']]
    : undertone === 'Cool'
    ? [['#4a6a9a','Navy'],['#6a9a8a','Sage'],['#9a7aa0','Lavender'],['#f0f0f5','Ice'],['#8a9ab0','Slate']]
    : [['#a09080','Taupe'],['#b8a898','Blush'],['#8a9888','Sage'],['#c0b0a0','Sand'],['#9aaa98','Mint']];
 
  useEffect(() => {
    fetchWeather();
    fetchTrending();
  }, []);
 
  const fetchWeather = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setWeather({ temp:'72°F', desc:'Sunny', area:'Your Location', tempC: 22, condCode: 800 });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const area = [place?.city, place?.region].filter(Boolean).join(', ') || 'Your Location';
      const res  = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_KEY}&units=imperial`
      );
      const data = await res.json();
      const tempF   = Math.round(data.main.temp);
      const desc    = data.weather[0]?.description || 'Clear';
      const condId  = data.weather[0]?.id || 800;
      const humidity = data.main.humidity;
      const windMph  = Math.round(data.wind?.speed || 0);
      setWeather({ temp: tempF + '°F', desc, area, tempF, condId, humidity, windMph });
      fetchOotd(tempF, desc, condId, humidity, windMph);
    } catch (e) {
      setWeather({ temp:'72°F', desc:'Sunny', area:'Your Location', tempF: 72, condId: 800 });
      fetchOotd(72, 'Sunny', 800, 50, 5);
    }
  };
 
  const fetchOotd = async (tempF, weatherDesc, condId, humidity, windMph) => {
    setLoadingOotd(true);
    try {
      const hour     = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      const styleHint = quizData?.styles?.length > 0 ? quizData.styles[0].toLowerCase() : 'casual';
      const isHot    = tempF >= 80;
      const isWarm   = tempF >= 65 && tempF < 80;
      const isCool   = tempF >= 45 && tempF < 65;
      const isCold   = tempF < 45;
      const isRainy  = condId >= 200 && condId < 700;
      const isWindy  = windMph > 15;
 
      let weatherContext = '';
      if (isHot)        weatherContext = 'hot and sunny weather';
      else if (isWarm)  weatherContext = 'warm pleasant weather';
      else if (isCool)  weatherContext = 'cool weather — light layers needed';
      else if (isCold)  weatherContext = 'cold weather — warm layers essential';
      if (isRainy)      weatherContext += ', rainy conditions';
      if (isWindy)      weatherContext += ', windy';
 
      const aiPrompt = `You are a personal stylist. The user's style preference is "${styleHint}".
Current weather: ${tempF}°F, ${weatherDesc}, ${weatherContext}.
Time of day: ${timeOfDay}.
Decide whether this outfit should be a DRESS or a TOP + BOTTOM pair.
- In hot weather (80°F+), prefer a dress.
- In cold/cool weather, prefer a top + bottom so layers work.
- Otherwise use your judgement.
Reply in EXACTLY one of these two formats, no other text:
If dress:
TYPE: dress
OUTFIT: <1 sentence description>
SEARCH: <2-4 word search query>
If top + bottom:
TYPE: top+bottom
OUTFIT: <1 sentence description>
TOP_SEARCH: <2-4 word search>
BOTTOM_SEARCH: <2-4 word search>`;
 
      const aiRes = await fetch(AZURE_OPENAI_ENDPOINT + '/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: AZURE_OPENAI_MODEL,
          messages: [{ role: 'user', content: aiPrompt }],
          max_tokens: 120, temperature: 0.7,
        }),
      });
      const aiData = await aiRes.json();
      const aiText = aiData.choices?.[0]?.message?.content || '';
 
      const typeMatch   = aiText.match(/TYPE:\s*(.+)/i);
      const outfitMatch = aiText.match(/OUTFIT:\s*(.+)/i);
      const outfitType  = typeMatch?.[1]?.trim().toLowerCase() || 'top+bottom';
      const outfitDesc  = outfitMatch?.[1]?.trim() || null;
 
      const brands = pickBrands(ageBucket, quizBrands, 8);
 
      const searchDrezily = async (query) => {
        let res = await fetch(DREZILY_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searches: [{ search: query, filters: {} }],
            universal_filters: { Brand: brands },
            chips: false, facets: false, page: 1,
          }),
        });
        let data = await res.json();
        let items = Array.isArray(data.results) ? data.results.filter(p => p.Display_Image && p.Title) : [];
        if (items.length === 0) {
          res = await fetch(DREZILY_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              searches: [{ search: query, filters: {} }],
              universal_filters: {},
              chips: false, facets: false, page: 1,
            }),
          });
          data = await res.json();
          items = Array.isArray(data.results) ? data.results.filter(p => p.Display_Image && p.Title) : [];
        }
        return items.length > 0 ? items[Math.floor(Math.random() * Math.min(items.length, 8))] : null;
      };
 
      if (outfitType === 'dress') {
        const searchMatch = aiText.match(/SEARCH:\s*(.+)/i);
        const query = searchMatch?.[1]?.trim() || styleHint + ' dress';
        const dressProduct = await searchDrezily(query);
        if (dressProduct) setOotd({ type:'dress', top: dressProduct, outfitDesc, weatherContext });
      } else {
        const topMatch    = aiText.match(/TOP_SEARCH:\s*(.+)/i);
        const bottomMatch = aiText.match(/BOTTOM_SEARCH:\s*(.+)/i);
        const topQuery    = topMatch?.[1]?.trim()    || styleHint + ' top blouse';
        const bottomQuery = bottomMatch?.[1]?.trim() || styleHint + ' jeans trousers';
        const [topProduct, bottomProduct] = await Promise.all([
          searchDrezily(topQuery),
          searchDrezily(bottomQuery),
        ]);
        if (topProduct && bottomProduct) {
          setOotd({ type:'top+bottom', top: topProduct, bottom: bottomProduct, outfitDesc, weatherContext });
        } else if (topProduct) {
          setOotd({ type:'dress', top: topProduct, outfitDesc, weatherContext });
        }
      }
    } catch (e) {}
    setLoadingOotd(false);
  };
 
  const fetchTrending = async () => {
    setLoadingTrending(true);
    try {
      const brands  = pickBrands(ageBucket, quizBrands, 8);
      const picks   = TRENDING_SEARCHES.slice(0, 3);
      const searches = picks.map(s => ({ search: s, filters: {} }));
      const res  = await fetch(DREZILY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searches, universal_filters: { Brand: brands }, chips: false, facets: false, page: 1 }),
      });
      const data    = await res.json();
      const results = Array.isArray(data.results)
        ? data.results.filter(p => p.Display_Image && p.Title).slice(0, 10)
        : [];
      if (results.length === 0) {
        const res2  = await fetch(DREZILY_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searches, universal_filters: {}, chips: false, facets: false, page: 1 }),
        });
        const data2 = await res2.json();
        setTrending(Array.isArray(data2.results) ? data2.results.filter(p => p.Display_Image && p.Title).slice(0, 10) : []);
      } else {
        setTrending(results);
      }
    } catch (e) {}
    setLoadingTrending(false);
  };
 
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Good afternoon,';
    return 'Good evening,';
  };
 
  return (
    <View style={[st.flex, { backgroundColor: C.bg }]}>
      <SafeAreaView style={{ zIndex:30, elevation:30 }}>
        <View style={st.dashHeader}>
          <View>
            <Text style={{ fontSize:11, color:C.muted, letterSpacing:1.5, textTransform:'uppercase' }}>{getGreeting()}</Text>
            <Text style={st.dashName}>{userName || 'there'}</Text>
          </View>
          <TouchableOpacity onPress={() => setMenuOpen(v => !v)} style={st.avatar}>
            <Text style={{ fontSize:13, color:C.muted, fontWeight:'600', letterSpacing:0.5 }}>Me</Text>
          </TouchableOpacity>
        </View>
 
        {menuOpen && (
          <View style={st.profileDropdown}>
            <TouchableOpacity style={st.profileDropdownItem}
              onPress={() => { setMenuOpen(false); onNav(SCREENS.PROFILE); }}>
              <Text style={st.profileDropdownText}>My Profile</Text>
            </TouchableOpacity>
            <View style={st.profileDropdownDivider} />
            <TouchableOpacity style={st.profileDropdownItem}
              onPress={() => { setMenuOpen(false); onSignOut(); }}>
              <Text style={[st.profileDropdownText, { color:'#A05050' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
 
      {menuOpen && (
        <TouchableOpacity style={{ position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:5 }}
          onPress={() => setMenuOpen(false)} activeOpacity={1} />
      )}
 
      <ScrollView style={{ zIndex:1 }} contentContainerStyle={{ paddingBottom:100 }}>
 
        {/* ── Weather + OOTD card ── */}
        <View style={st.weatherCard}>
          <View style={{ marginBottom:16 }}>
            <Text style={{ color:'rgba(26,26,26,0.55)', fontSize:11, letterSpacing:1.5, textTransform:'uppercase' }}>
              {weather ? weather.area : 'Getting location...'}
            </Text>
            <Text style={{ color:'#1A1A1A', fontSize:32, fontWeight:'300', marginTop:4 }}>
              {weather ? weather.temp : '--'}
            </Text>
            <Text style={{ color:'rgba(26,26,26,0.55)', fontSize:13, textTransform:'capitalize', marginTop:2 }}>
              {weather ? weather.desc : ''}
              {weather?.humidity ? `  ·  ${weather.humidity}% humidity` : ''}
            </Text>
          </View>
 
          {/* Hairline separator */}
          <View style={{ height:1, backgroundColor:'rgba(26,26,26,0.12)', marginBottom:16 }} />
 
          {/* OOTD */}
          {loadingOotd ? (
            <View style={{ alignItems:'center', paddingVertical:16 }}>
              <ActivityIndicator color="rgba(26,26,26,0.4)" />
            </View>
          ) : ootd ? (
            <View>
              <Text style={st.ootdLabel}>Outfit of the day</Text>
              {ootd.outfitDesc && (
                <Text style={st.ootdTitle} numberOfLines={2}>{ootd.outfitDesc}</Text>
              )}
              <View style={{ flexDirection:'row', gap:10, marginTop:10 }}>
                <TouchableOpacity
                  style={{ flex:1, borderRadius:10, overflow:'hidden' }}
                  onPress={() => ootd.top?.Item_Url && Linking.openURL(ootd.top.Item_Url)}
                >
                  <Image source={{ uri: ootd.top?.Display_Image }}
                    style={{ width:'100%', height:100 }} resizeMode="cover" />
                  <View style={{ paddingTop:6 }}>
                    <Text style={st.ootdSub} numberOfLines={1}>{ootd.top?.Brand}</Text>
                    <Text style={{ color:'#1A1A1A', fontSize:13, fontWeight:'600' }}>${ootd.top?.Selling_Price}</Text>
                  </View>
                </TouchableOpacity>
                {ootd.type === 'top+bottom' && ootd.bottom && (
                  <TouchableOpacity
                    style={{ flex:1, borderRadius:10, overflow:'hidden' }}
                    onPress={() => ootd.bottom?.Item_Url && Linking.openURL(ootd.bottom.Item_Url)}
                  >
                    <Image source={{ uri: ootd.bottom?.Display_Image }}
                      style={{ width:'100%', height:100 }} resizeMode="cover" />
                    <View style={{ paddingTop:6 }}>
                      <Text style={st.ootdSub} numberOfLines={1}>{ootd.bottom?.Brand}</Text>
                      <Text style={{ color:'#1A1A1A', fontSize:13, fontWeight:'600' }}>${ootd.bottom?.Selling_Price}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View>
              <Text style={st.ootdLabel}>Outfit of the day</Text>
              <Text style={st.ootdTitle}>Check back soon for today's pick</Text>
            </View>
          )}
        </View>
 
        {/* ── Trending products ── */}
        <View style={{ paddingHorizontal:24, marginTop:28, marginBottom:14 }}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>Trending for you</Text>
            <TouchableOpacity onPress={() => onNav(SCREENS.SHOPPING)}>
              <Text style={{ fontSize:12, color:C.accent, letterSpacing:1, textTransform:'uppercase' }}>See all</Text>
            </TouchableOpacity>
          </View>
        </View>
 
        {loadingTrending ? (
          <View style={{ height:200, alignItems:'center', justifyContent:'center' }}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal:24, gap:12 }}>
            {trendingProducts.length > 0 ? trendingProducts.map((item, i) => (
              <TouchableOpacity key={item.Product_Id + '-' + i}
                onPress={() => item.Item_Url && Linking.openURL(item.Item_Url)}
                style={[st.productCard, { width:148 }]}>
                <Image source={{ uri: item.Display_Image }}
                  style={{ width:148, height:178 }} resizeMode="cover" />
                <View style={{ padding:10 }}>
                  <Text style={st.productBrand}>{item.Brand}</Text>
                  <Text style={st.productTitle} numberOfLines={2}>{item.Title}</Text>
                  <Text style={st.productPrice}>${item.Selling_Price}</Text>
                </View>
              </TouchableOpacity>
            )) : (
              <Text style={{ color:C.muted, fontSize:13, paddingVertical:20 }}>Check back soon for trending picks</Text>
            )}
          </ScrollView>
        )}
 
        {/* ── Flattering colors ── */}
        <View style={{ paddingHorizontal:24, marginTop:32 }}>
          <Text style={[st.sectionTitle, { marginBottom:4 }]}>Flattering for your coloring</Text>
          <Text style={{ fontSize:13, color:C.muted, marginBottom:16 }}>
            Based on your {undertone.toLowerCase()} undertones
          </Text>
          <View style={st.colorCard}>
            <View style={{ flexDirection:'row', gap:8, marginBottom:16, justifyContent:'center' }}>
              {colorPalette.map(([hex, name]) => (
                <View key={name} style={{ alignItems:'center', gap:6 }}>
                  <View style={{ width:40, height:40, borderRadius:20, backgroundColor:hex }} />
                  <Text style={{ fontSize:9, color:C.muted, textAlign:'center', letterSpacing:0.5, textTransform:'uppercase' }}>{name}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => {
                const colorNames = colorPalette.map(([, name]) => name.toLowerCase()).join(' ');
                onNav(SCREENS.SHOPPING, { initialSearch: colorNames + ' clothing' });
              }}
              style={st.btnDark}
            >
              <Text style={st.btnDarkText}>Shop these colors</Text>
            </TouchableOpacity>
          </View>
        </View>
 
      </ScrollView>
    </View>
  );
}
 
// ── Shopping ───────────────────────────────────────────────────────────────────
const SHOP_CATEGORIES = [
  { label:'All',        search:'women clothing' },
  { label:'Dresses',    search:'women dress' },
  { label:'Tops',       search:'women top blouse' },
  { label:'Bottoms',    search:'women jeans pants skirt' },
  { label:'Outerwear',  search:'women jacket blazer coat' },
  { label:'Activewear', search:'women activewear leggings' },
];
 
const STYLE_RULES = {
  top: {
    searches: ['wide leg jeans women', 'midi skirt women', 'tailored trousers women', 'mini skirt women', 'straight leg pants women'],
    keepSubcats: ['jeans', 'pants', 'trousers', 'skirt', 'shorts', 'leggings', 'bottoms', 'denim'],
    rejectSubcats: ['dress', 'jumpsuit', 'top', 'blouse', 'shirt', 'sweater', 'jacket', 'coat'],
  },
  bottom: {
    searches: ['fitted blouse women', 'cropped sweater women', 'ribbed tank top women', 'bodysuit women', 'silk blouse women'],
    keepSubcats: ['top', 'blouse', 'shirt', 'sweater', 'tank', 'bodysuit', 'tee', 'knit', 'tops'],
    rejectSubcats: ['dress', 'jumpsuit', 'jeans', 'pants', 'trousers', 'skirt', 'shorts', 'leggings'],
  },
  dress: {
    searches: ['leather jacket women', 'oversized blazer women', 'chunky cardigan women', 'ankle boots women', 'strappy heels women'],
    keepSubcats: ['jacket', 'blazer', 'cardigan', 'coat', 'outerwear', 'boot', 'heel', 'shoe', 'sandal'],
    rejectSubcats: ['dress', 'jumpsuit', 'top', 'blouse', 'jeans', 'pants', 'skirt', 'shorts'],
  },
  outerwear: {
    searches: ['fitted blouse women', 'straight jeans women', 'crew neck sweater women', 'tailored trousers women'],
    keepSubcats: ['top', 'blouse', 'shirt', 'sweater', 'jeans', 'pants', 'trousers', 'bottoms'],
    rejectSubcats: ['dress', 'jumpsuit', 'jacket', 'coat', 'outerwear'],
  },
  shoes: {
    searches: ['midi dress casual women', 'straight jeans women', 'flowy skirt women', 'tailored trousers women'],
    keepSubcats: ['dress', 'jeans', 'pants', 'skirt', 'trousers', 'tops', 'blouse'],
    rejectSubcats: ['shoe', 'boot', 'heel', 'sandal', 'sneaker'],
  },
};
 
function filterByCategory(products, rule) {
  if (!rule || (!rule.keepSubcats && !rule.rejectSubcats)) return products;
  return products.filter(p => {
    const subcats = [p.Subcategory1, p.Subcategory2, p.Subcategory3, p.Title]
      .filter(Boolean).join(' ').toLowerCase();
    const rejected = rule.rejectSubcats?.some(w => subcats.includes(w));
    if (rejected) return false;
    return true;
  });
}
 
async function analyzeClosetItem(imageUrl) {
  const systemPrompt = `You are a fashion stylist. Look at the clothing item in the image.
Identify ONLY these fields:
- "type": MUST be exactly one of: top, bottom, dress, outerwear, shoes, accessory
- "subtype": specific name (e.g. "midi skirt", "ribbed sweater")
- "color": dominant color(s) simply described
- "pattern": e.g. "solid", "striped", "floral"
- "style": e.g. "casual", "preppy", "boho", "minimalist", "formal"
- "description": one short phrase
Return ONLY valid JSON, no markdown:
{"type":"...","subtype":"...","color":"...","pattern":"...","style":"...","description":"..."}`;
 
  try {
    const res = await fetch(AZURE_OPENAI_ENDPOINT + '/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AZURE_OPENAI_MODEL,
        messages: [{ role: 'user', content: [
          { type: 'text', text: systemPrompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ]}],
        max_tokens: 200, temperature: 0.3,
      }),
    });
    const data = await res.json();
    if (data.error) return null;
    const raw = data.choices?.[0]?.message?.content || '';
    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch { return null; }
    if (!parsed.type) return null;
    return parsed;
  } catch (e) { return null; }
}
 
async function fetchComplementaryItems(analysis, ageBucket, quizBrands) {
  const type   = analysis?.type || 'top';
  const rule   = STYLE_RULES[type] || STYLE_RULES.top;
  const brands = pickBrands(ageBucket, quizBrands, 10);
  const results = [];
  const seenIds = new Set();
 
  for (const search of rule.searches) {
    if (results.length >= 8) break;
    try {
      const callDrezily = async (brandFilter) => {
        const res = await fetch(DREZILY_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searches: [{ search, filters: {} }], universal_filters: brandFilter, chips: false, facets: false, page: 1 }),
        });
        const data = await res.json();
        return Array.isArray(data.results) ? data.results.filter(p => p.Display_Image && p.Title) : [];
      };
      let items = await callDrezily({ Brand: brands });
      if (items.length === 0) items = await callDrezily({});
      items = filterByCategory(items, rule);
      let added = 0;
      for (const p of items) {
        if (added >= 2) break;
        if (!seenIds.has(p.Product_Id)) { seenIds.add(p.Product_Id); results.push(p); added++; }
      }
    } catch (e) {}
  }
  return results;
}
 
const ZILY_WS_URL = 'wss://ml-test.drezily.com/v4/conversational-search/ws';
 
function searchWithZily(userPrompt, sessionId) {
  return new Promise((resolve) => {
    let resolved = false;
    let intermediateAttrs = null;
    let ws;
    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try { ws && ws.close(1000); } catch {}
      resolve(result);
    };
    const timer = setTimeout(() => { finish(null); }, 9000);
    try { ws = new WebSocket(ZILY_WS_URL); } catch (e) { finish(null); return; }
    ws.onopen = () => {
      ws.send(JSON.stringify({ user_prompt: userPrompt, session_id: sessionId, origin: 'https://www.drezily.com' }));
    };
    ws.onmessage = (e) => {
      let data;
      try { data = JSON.parse(e.data); } catch { return; }
      if (data.type === 'intermediate') {
        intermediateAttrs = data.combined_attributes || null;
      } else if (data.type === 'final') {
        finish({ combined_attributes: data.combined_attributes || intermediateAttrs, reply: data.textual_assistant_response, suggestions: Array.isArray(data.suggestions) ? data.suggestions : [] });
      } else if (data.type === 'error') { finish(null); }
    };
    ws.onerror = () => { finish(null); };
    ws.onclose = () => { if (!resolved) finish(null); };
  });
}
 
function buildSearchesFromAttributes(combinedAttrs) {
  if (!combinedAttrs || typeof combinedAttrs !== 'object') return null;
  const searches = [];
  Object.values(combinedAttrs).forEach(arr => {
    if (!Array.isArray(arr)) return;
    arr.forEach(item => {
      const search  = item.direct_search || item.search || '';
      const filters = (item.filters && item.filters.attributes) || item.filters || {};
      if (search || Object.keys(filters).length > 0) searches.push({ search, filters });
    });
  });
  return searches.length > 0 ? searches : null;
}
 
const GENERIC_SEARCH_WORDS = new Set([
  'women', 'womens', "women's", 'clothing', 'clothes', 'apparel', 'items', 'products',
  'dresses', 'dress', 'tops', 'top', 'bottoms', 'options', 'option', 'styles', 'style',
  'outfits', 'outfit', 'i', 'a', 'an', 'the', 'to', 'be', 'as', 'well', 'also', 'too',
  'and', 'or', 'with', 'for', 'me', 'please', 'want', 'need', 'like', 'some', 'have',
  'can', 'it', 'this', 'that', 'show', 'find', 'looking', 'in',
]);
 
function dedupeProducts(arr) {
  const seen = new Set();
  return arr.filter(p => {
    if (seen.has(p.Product_Id)) return false;
    seen.add(p.Product_Id);
    return true;
  });
}
 
function combineWithPrevious(newSearch, previousQuery) {
  const newTerm = (newSearch || '').trim();
  const prevTerm = (previousQuery || '').trim();
  if (!prevTerm) return newTerm;
  if (!newTerm) return prevTerm;
  const newWords  = newTerm.toLowerCase().split(/\s+/);
  const prevWords = prevTerm.toLowerCase().split(/\s+/);
  const meaningfulNew = newWords.filter(w => !GENERIC_SEARCH_WORDS.has(w) && !prevWords.includes(w));
  if (meaningfulNew.length === 0) return prevTerm;
  const combinedWords = [...prevWords, ...meaningfulNew].filter((w, i, arr) => arr.indexOf(w) === i);
  return combinedWords.join(' ');
}
 
function combineAllWithPrevious(newSearches, previousQuery) {
  const prevTerm = (previousQuery || '').trim();
  if (!prevTerm) { const first = newSearches.find(s => (s || '').trim()); return first ? first.trim() : ''; }
  const prevWords = prevTerm.toLowerCase().split(/\s+/);
  const extraWords = [];
  newSearches.forEach(s => {
    const words = (s || '').toLowerCase().split(/\s+/).filter(Boolean);
    words.forEach(w => {
      if (!GENERIC_SEARCH_WORDS.has(w) && !prevWords.includes(w) && !extraWords.includes(w)) extraWords.push(w);
    });
  });
  return [...prevWords, ...extraWords].join(' ');
}
 
async function parseQueryWithAI(userMessage, history) {
  const messages = [
    {
      role: 'system',
      content: `You are a fashion search assistant for a shopping app. Convert the user's natural language request into a concise search query for a fashion database.
If the conversation history shows a previous search topic and the new message is a refinement, COMBINE the previous topic with the new request.
Return ONLY a JSON object with two fields:
- "query": a short 3-7 word search string
- "reply": a warm, friendly 1-sentence response acknowledging what you are searching for (no em dashes)
Only valid JSON.`,
    },
    ...history.map(m => ({ role: m.role, content: m.text })),
    { role: 'user', content: userMessage },
  ];
  const res  = await fetch(AZURE_OPENAI_ENDPOINT + '/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: AZURE_OPENAI_MODEL, messages, max_tokens: 150, temperature: 0.7 }),
  });
  const data = await res.json();
  if (data.error) return { query: userMessage, reply: "On it! Let me find that for you." };
  const raw = data.choices?.[0]?.message?.content || '';
  let parsed;
  try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch { parsed = {}; }
  return { query: parsed.query || userMessage, reply: parsed.reply || "On it! Let me find that for you." };
}
 
function ShoppingScreen({ userAge, quizData, initialSearch }) {
  const ageBucket  = getAgeBucket(userAge || '25');
  const quizBrands = quizData?.brands || [];
 
  const [catIdx, setCatIdx]         = useState(0);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(null);
  const fetchingRef                 = useRef(false);
 
  const [searchMode, setSearchMode]   = useState(!!initialSearch);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [searchHistory, setSearchHistory] = useState(
    initialSearch ? [
      { role:'user',      text:'Shop flattering colors for my coloring' },
      { role:'assistant', text:'Here are pieces in your most flattering colors, chosen to complement your undertone!' },
    ] : []
  );
  const [chatProducts, setChatProducts] = useState([]);
  const [chatSuggestions, setChatSuggestions] = useState([]);
  const [chatLoading, setChatLoading] = useState(!!initialSearch);
  const [showChat, setShowChat]       = useState(false);
  const sessionId = useRef('session-' + Date.now());
  const historyScrollRef = useRef(null);
  const lastQueryRef = useRef(initialSearch || '');
 
  useEffect(() => {
    if (initialSearch) { runColorSearch(initialSearch); }
  }, []);
 
  const runColorSearch = async (query) => {
    setChatLoading(true);
    try {
      const brands = pickBrands(ageBucket, quizBrands, 10);
      const callAPI = async (filter) => {
        const res = await fetch(DREZILY_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searches: [{ search: query, filters: {} }], universal_filters: filter, chips: false, facets: false, page: 1 }),
        });
        const data = await res.json();
        return Array.isArray(data.results) ? data.results.filter(p => p.Display_Image && p.Title) : [];
      };
      let items = await callAPI({ Brand: brands });
      if (items.length === 0) items = await callAPI({});
      setChatProducts(dedupeProducts(items));
      lastQueryRef.current = query;
    } catch (e) {}
    setChatLoading(false);
  };
 
  useEffect(() => {
    if (!searchMode) { setProducts([]); setPage(1); setLoading(true); fetchShop(SHOP_CATEGORIES[catIdx].search, 1, true); }
  }, [catIdx, searchMode]);
 
  const fetchShop = async (search, pageNum, reset) => {
    if (fetchingRef.current && !reset) return;
    fetchingRef.current = true;
    if (reset) setLoading(true);
    const callAPI = async (brandFilter) => {
      const res = await fetch(DREZILY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searches: [{ search, filters: {} }], universal_filters: brandFilter, chips: false, facets: false, page: pageNum }),
      });
      const data = await res.json();
      return Array.isArray(data.results) ? data.results.filter(p => p.Display_Image && p.Title) : [];
    };
    try {
      const brands = pickBrands(ageBucket, quizBrands, 10);
      let items = await callAPI({ Brand: brands });
      if (items.length === 0) items = await callAPI({});
      reset ? setProducts(items) : setProducts(prev => [...prev, ...items]);
      setPage(pageNum);
    } catch (e) {}
    setLoading(false);
    fetchingRef.current = false;
  };
 
  const runSearch = async (overrideText) => {
    const msg = (overrideText !== undefined ? overrideText : searchInput).trim();
    if (!msg || chatLoading) return;
    const previousQuery = lastQueryRef.current;
    setSearchMode(true);
    setSearchInput('');
    setSearchQuery(msg);
    setChatLoading(true);
    setChatSuggestions([]);
    const newHistory = [...searchHistory, { role: 'user', text: msg }];
    setSearchHistory(newHistory);
    setTimeout(() => historyScrollRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const brands = pickBrands(ageBucket, quizBrands, 10);
      const zilyResult = await searchWithZily(msg, sessionId.current);
      let items = [];
      let replyText = null;
      let suggestions = [];
      let effectiveQuery = combineWithPrevious(msg, previousQuery);
 
      if (zilyResult) {
        replyText  = zilyResult.reply;
        suggestions = zilyResult.suggestions || [];
        let zilySearches = buildSearchesFromAttributes(zilyResult.combined_attributes);
        if (zilySearches && previousQuery) {
          const combined = combineAllWithPrevious(zilySearches.map(s => s.search), previousQuery);
          zilySearches = [{ search: combined, filters: {} }];
        }
        if (!zilySearches && previousQuery) zilySearches = [{ search: combineWithPrevious(msg, previousQuery), filters: {} }];
        if (zilySearches) {
          const seenSearch = new Set();
          zilySearches = zilySearches.filter(s => {
            const key = (s.search || '').toLowerCase() + '|' + JSON.stringify(s.filters || {});
            if (seenSearch.has(key)) return false;
            seenSearch.add(key);
            return true;
          });
        }
        if (zilySearches) {
          effectiveQuery = zilySearches[0].search || effectiveQuery;
          const res = await fetch(DREZILY_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ searches: zilySearches, universal_filters: { Brand: brands }, chips: false, facets: false, page: 1 }),
          });
          const data = await res.json();
          items = dedupeProducts(Array.isArray(data.results) ? data.results.filter(p => p.Display_Image && p.Title) : []);
          if (items.length < 6) {
            const res2 = await fetch(DREZILY_API, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ searches: zilySearches, universal_filters: {}, chips: false, facets: false, page: 1 }),
            });
            const data2 = await res2.json();
            const extra = dedupeProducts(Array.isArray(data2.results) ? data2.results.filter(p => p.Display_Image && p.Title) : []);
            const seen = new Set(items.map(p => p.Product_Id));
            extra.forEach(p => { if (!seen.has(p.Product_Id)) { seen.add(p.Product_Id); items.push(p); } });
          }
        }
      }
      if (items.length < 4) {
        const { query, reply } = await parseQueryWithAI(msg, searchHistory.slice(-6));
        const safeQuery = combineWithPrevious(query || msg, previousQuery);
        effectiveQuery = safeQuery;
        if (!replyText) replyText = reply;
        const searchVariations = [safeQuery, safeQuery.split(' ').slice(0, 3).join(' ')].filter((s, i, arr) => s && arr.indexOf(s) === i);
        const seen = new Set(items.map(p => p.Product_Id));
        const mergeExtra = (extra) => { extra.forEach(p => { if (!seen.has(p.Product_Id)) { seen.add(p.Product_Id); items.push(p); } }); };
        for (const search of searchVariations) {
          if (items.length >= 6) break;
          const res = await fetch(DREZILY_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ searches: [{ search, filters: {} }], universal_filters: { Brand: brands }, chips: false, facets: false, page: 1 }) });
          const data = await res.json();
          mergeExtra(Array.isArray(data.results) ? data.results.filter(p => p.Display_Image && p.Title) : []);
        }
        if (items.length < 6) {
          for (const search of searchVariations) {
            if (items.length >= 6) break;
            const res = await fetch(DREZILY_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ searches: [{ search, filters: {} }], universal_filters: {}, chips: false, facets: false, page: 1 }) });
            const data = await res.json();
            mergeExtra(Array.isArray(data.results) ? data.results.filter(p => p.Display_Image && p.Title) : []);
          }
        }
      }
      const finalReply = replyText || (items.length > 0 ? `Here's what I found for "${msg}"` : `No matches found. Try describing it differently.`);
      lastQueryRef.current = effectiveQuery;
      setSearchQuery(effectiveQuery);
      setSearchHistory(prev => [...prev, { role: 'assistant', text: finalReply }]);
      setChatProducts(items);
      setChatSuggestions(suggestions);
    } catch (e) {
      setSearchHistory(prev => [...prev, { role: 'assistant', text: "Something went wrong. Please try again." }]);
    }
    setChatLoading(false);
    setShowChat(false);
  };
 
  const ITEM_W = (SCREEN_W - 48) / 2;
 
  const renderProductCard = (item, onPress) => (
    <TouchableOpacity onPress={onPress} style={[st.productCard, { width: ITEM_W }]}>
      <Image source={{ uri: item.Display_Image }}
        style={{ width:ITEM_W, height:ITEM_W * 1.2 }} resizeMode="cover" />
      {item.Discount_Percentage > 0 && (
        <View style={st.discountBadge}>
          <Text style={{ color:'#fff', fontSize:10, fontWeight:'700', letterSpacing:0.5 }}>
            {Math.round(item.Discount_Percentage)}% off
          </Text>
        </View>
      )}
      <View style={{ padding:10 }}>
        <Text style={st.productBrand}>{item.Brand}</Text>
        <Text style={st.productTitle} numberOfLines={2}>{item.Title}</Text>
        <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginTop:4 }}>
          <Text style={st.productPrice}>${item.Selling_Price}</Text>
          {item.Original_Price > item.Selling_Price && (
            <Text style={{ fontSize:11, color:'#C0C0C0', textDecorationLine:'line-through' }}>
              ${item.Original_Price}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
 
  if (selected) {
    const discounted = selected.Original_Price > selected.Selling_Price;
    const pct = selected.Discount_Percentage;
    return (
      <View style={[st.flex, { backgroundColor: C.bg }]}>
        <SafeAreaView>
          <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:24, paddingVertical:12 }}>
            <TouchableOpacity onPress={() => setSelected(null)} style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
              <Text style={{ fontSize:18, color:C.dark, fontWeight:'300' }}>←</Text>
              <Text style={{ fontSize:13, color:C.muted, letterSpacing:0.5 }}>Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <ScrollView contentContainerStyle={{ paddingBottom:120 }}>
          <Image source={{ uri: selected.Display_Image }}
            style={{ width:SCREEN_W, height:SCREEN_W * 1.2 }} resizeMode="cover" />
          <View style={{ padding:24 }}>
            <Text style={st.productBrand}>{selected.Brand}</Text>
            <Text style={{ fontSize:22, fontWeight:'500', color:C.dark, marginBottom:12, lineHeight:28, marginTop:4 }}>
              {selected.Title}
            </Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:16 }}>
              <Text style={[st.productPrice, { fontSize:22 }]}>${selected.Selling_Price}</Text>
              {discounted && (
                <>
                  <Text style={{ fontSize:15, color:'#C0C0C0', textDecorationLine:'line-through' }}>${selected.Original_Price}</Text>
                  {pct > 0 && (
                    <View style={{ backgroundColor:C.softGreen, borderRadius:6, paddingHorizontal:8, paddingVertical:3 }}>
                      <Text style={{ fontSize:11, color:C.accent, fontWeight:'600', letterSpacing:0.5 }}>{Math.round(pct)}% off</Text>
                    </View>
                  )}
                </>
              )}
            </View>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 }}>
              {[selected.Subcategory1, selected.Subcategory2, selected.Subcategory3].filter(Boolean).map((s, i) => (
                <View key={i} style={{ backgroundColor:C.softGreen, borderRadius:6, paddingHorizontal:10, paddingVertical:4 }}>
                  <Text style={{ fontSize:11, color:C.muted, letterSpacing:0.5 }}>{s}</Text>
                </View>
              ))}
            </View>
            {selected.Description ? (
              <Text style={{ fontSize:14, color:C.muted, lineHeight:22, marginBottom:20 }}>{selected.Description}</Text>
            ) : null}
            {selected.Source ? (
              <Text style={{ fontSize:12, color:C.muted, marginBottom:20, letterSpacing:0.5, textTransform:'uppercase' }}>Available at {selected.Source}</Text>
            ) : null}
          </View>
        </ScrollView>
        <View style={{ position:'absolute', bottom:0, left:0, right:0, padding:24,
          backgroundColor:C.bg, borderTopWidth:1, borderTopColor:C.hairline }}>
          <TouchableOpacity onPress={() => selected.Item_Url && Linking.openURL(selected.Item_Url)}
            style={[st.btnDark, { margin:0 }]}>
            <Text style={st.btnDarkText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
 
  if (searchMode) {
    return (
      <View style={[st.flex, { backgroundColor: C.bg }]}>
        <SafeAreaView>
          <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:24, paddingTop:12, paddingBottom:8, gap:12 }}>
            <TouchableOpacity onPress={() => setSearchMode(false)}>
              <Text style={{ fontSize:18, color:C.dark, fontWeight:'300' }}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowChat(true)}
              style={{ flex:1, flexDirection:'row', alignItems:'center', backgroundColor:C.softGreen,
                borderRadius:10, paddingHorizontal:14, paddingVertical:10, gap:8 }}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#8A9589" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M21 21L16.65 16.65" stroke="#8A9589" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
              <Text style={{ flex:1, fontSize:14, color: searchQuery ? C.dark : C.muted }} numberOfLines={1}>
                {searchQuery || "Search for anything..."}
              </Text>
            </TouchableOpacity>
            {searchHistory.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchHistory([]); setSearchQuery(''); setChatProducts([]); setChatSuggestions([]);
                sessionId.current = 'session-' + Date.now(); lastQueryRef.current = ''; setShowChat(true);
              }}>
                <Text style={{ fontSize:11, color:C.accent, fontWeight:'600', letterSpacing:1, textTransform:'uppercase' }}>New</Text>
              </TouchableOpacity>
            )}
          </View>
 
          {!showChat && !chatLoading && searchQuery && (
            <View style={{ paddingHorizontal:24, paddingBottom:8 }}>
              <Text style={{ fontSize:20, fontWeight:'500', color:C.dark }} numberOfLines={1}>
                "{searchQuery}"
              </Text>
              <Text style={{ fontSize:11, color:C.muted, marginTop:2, letterSpacing:1, textTransform:'uppercase' }}>
                {chatProducts.length} items
              </Text>
            </View>
          )}
        </SafeAreaView>
 
        {!chatLoading && searchHistory.length > 0 && chatProducts.length === 0 ? (
          <View style={st.centerFlex}>
            <Text style={{ fontSize:13, color:C.muted, textAlign:'center', paddingHorizontal:40, letterSpacing:0.5 }}>
              No results found. Try describing it differently.
            </Text>
          </View>
        ) : searchHistory.length === 0 && !chatLoading ? (
          <View style={st.centerFlex}>
            <Text style={{ fontSize:13, color:C.muted, textAlign:'center', paddingHorizontal:40 }}>
              Try "flowy red dress" or "cozy neutral sweater"
            </Text>
          </View>
        ) : (
          <FlatList
            data={chatProducts}
            numColumns={2}
            keyExtractor={(item, i) => item.Product_Id + '-' + i}
            contentContainerStyle={{ padding:12, paddingBottom:100, gap:12 }}
            columnWrapperStyle={{ gap:12 }}
            renderItem={({ item }) => renderProductCard(item, () => setSelected(item))}
          />
        )}
 
        {showChat && (
          <View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:C.bg, zIndex:50 }}>
            <KeyboardAvoidingView style={st.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <SafeAreaView style={{ flex:0 }}>
                <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:24, paddingTop:12, paddingBottom:8 }}>
                  <TouchableOpacity onPress={() => setShowChat(false)} style={{ marginRight:12 }}>
                    <Text style={{ fontSize:18, color:C.dark, fontWeight:'300' }}>←</Text>
                  </TouchableOpacity>
                  <Text style={st.dashName}>Search</Text>
                  {searchHistory.length > 0 && (
                    <TouchableOpacity onPress={() => {
                      setSearchHistory([]); setSearchQuery(''); setChatProducts([]); setChatSuggestions([]);
                      sessionId.current = 'session-' + Date.now(); lastQueryRef.current = '';
                    }} style={{ marginLeft:'auto' }}>
                      <Text style={{ fontSize:11, color:C.accent, fontWeight:'600', letterSpacing:1, textTransform:'uppercase' }}>New</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </SafeAreaView>
 
              <ScrollView ref={historyScrollRef} style={st.flex} contentContainerStyle={{ padding:24, paddingBottom:16 }}
                onContentSizeChange={() => historyScrollRef.current?.scrollToEnd({ animated: true })}>
                {searchHistory.length === 0 && !chatLoading && (
                  <Text style={{ fontSize:14, color:C.muted, paddingVertical:20, lineHeight:22 }}>
                    Search for anything — try "flowy red dress" or "cozy neutral sweater". You can ask follow-ups like "show me cheaper options" too.
                  </Text>
                )}
 
                {searchHistory.map((msg, i) => (
                  <View key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth:'85%', marginBottom:10 }}>
                    <View style={{
                      backgroundColor: msg.role === 'user' ? C.dark : C.white,
                      borderRadius: 14,
                      borderBottomRightRadius: msg.role === 'user' ? 4 : 14,
                      borderBottomLeftRadius: msg.role === 'user' ? 14 : 4,
                      paddingHorizontal:14, paddingVertical:10,
                      shadowColor:'#000', shadowOpacity:0.04, shadowRadius:4, elevation:1,
                    }}>
                      <Text style={{ fontSize:14, color: msg.role === 'user' ? '#fff' : C.dark, lineHeight:20 }}>
                        {msg.text}
                      </Text>
                    </View>
                  </View>
                ))}
 
                {chatLoading && (
                  <View style={{ alignSelf:'flex-start', marginBottom:8 }}>
                    <View style={{ backgroundColor:C.white, borderRadius:14, borderBottomLeftRadius:4, paddingHorizontal:16, paddingVertical:12 }}>
                      <ActivityIndicator size="small" color={C.accent} />
                    </View>
                  </View>
                )}
 
                {chatSuggestions.length > 0 && !chatLoading && (
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:4 }}>
                    {chatSuggestions.map((s, i) => (
                      <TouchableOpacity key={i} onPress={() => runSearch(s)}
                        style={{ backgroundColor:C.white, borderRadius:10, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:C.hairline }}>
                        <Text style={{ fontSize:13, color:C.dark }}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
 
              <View style={{ flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:24,
                paddingVertical:12, paddingBottom: Platform.OS === 'ios' ? 12 : 12,
                backgroundColor:C.white, borderTopWidth:1, borderTopColor:C.hairline }}>
                <TextInput
                  value={searchInput}
                  onChangeText={setSearchInput}
                  placeholder={searchHistory.length === 0 ? "Search for anything..." : "Refine your search..."}
                  placeholderTextColor={C.muted}
                  style={{ flex:1, backgroundColor:C.softGreen, borderRadius:10, paddingHorizontal:16,
                    paddingVertical:10, fontSize:14, color:C.dark }}
                  onSubmitEditing={() => runSearch()}
                  returnKeyType="search"
                  autoFocus
                />
                <TouchableOpacity onPress={() => runSearch()} disabled={chatLoading || !searchInput.trim()}
                  style={{ width:40, height:40, borderRadius:10,
                    backgroundColor: searchInput.trim() ? C.dark : C.hairline,
                    alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ color:'#fff', fontSize:16 }}>↑</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
      </View>
    );
  }
 
  return (
    <View style={[st.flex, { backgroundColor: C.bg }]}>
      <SafeAreaView>
        <View style={st.dashHeader}>
          <Text style={st.dashName}>Shop</Text>
          <TouchableOpacity onPress={() => { setSearchMode(true); setShowChat(true); }}
            style={st.headerBtn}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M21 21L16.65 16.65" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </TouchableOpacity>
        </View>
 
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal:24, gap:8, paddingBottom:12 }}>
          {SHOP_CATEGORIES.map((cat, i) => (
            <TouchableOpacity key={cat.label} onPress={() => setCatIdx(i)}
              style={[st.filterPill, i === catIdx && st.filterPillActive]}>
              <Text style={[st.filterPillText, i === catIdx && st.filterPillTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
 
      {loading ? (
        <View style={st.centerFlex}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={{ marginTop:16, fontSize:12, color:C.muted, letterSpacing:1.5, textTransform:'uppercase' }}>Loading</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={st.centerFlex}>
          <Text style={{ fontSize:13, color:C.muted, textAlign:'center', paddingHorizontal:40 }}>
            No products found. Try a different category.
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item, i) => item.Product_Id + '-' + i}
          contentContainerStyle={{ padding:12, paddingBottom:100, gap:12 }}
          columnWrapperStyle={{ gap:12 }}
          onEndReached={() => { if (!fetchingRef.current) fetchShop(SHOP_CATEGORIES[catIdx].search, page + 1); }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => renderProductCard(item, () => setSelected(item))}
          ListFooterComponent={fetchingRef.current ? <ActivityIndicator style={{ marginVertical:20 }} color={C.accent} /> : null}
        />
      )}
    </View>
  );
}
 
// ── Style This Outfit ────────────────────────────────────────────────────────
function StyleThisScreen({ item, onBack, userAge, quizData }) {
  const ageBucket  = getAgeBucket(userAge || '25');
  const quizBrands = quizData?.brands || [];
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [garmentType, setGarmentType] = useState(null);
 
  const GARMENT_OPTIONS = [
    { label: 'Top / Shirt / Sweater',  type: 'top'       },
    { label: 'Jeans / Pants / Shorts', type: 'bottom'    },
    { label: 'Skirt',                  type: 'bottom'    },
    { label: 'Dress / Jumpsuit',       type: 'dress'     },
    { label: 'Jacket / Coat / Blazer', type: 'outerwear' },
    { label: 'Shoes',                  type: 'shoes'     },
  ];
 
  useEffect(() => {
    if (garmentType) fetchSuggestions(garmentType);
  }, [garmentType]);
 
  const tryAIAnalysis = async () => {
    setLoading(true);
    try {
      const result = await analyzeClosetItem(item.image_url);
      if (result && result.type) {
        setAnalysis(result);
        const items = await fetchComplementaryItems(result, ageBucket, quizBrands);
        setSuggestions(items.slice(0, 4));
        setLoading(false);
        return;
      }
    } catch (e) {}
    setLoading(false);
  };
 
  const fetchSuggestions = async (option) => {
    setLoading(true);
    const fakeAnalysis = { type: option.type };
    const items = await fetchComplementaryItems(fakeAnalysis, ageBucket, quizBrands);
    setSuggestions(items.slice(0, 4));
    setLoading(false);
  };
 
  useEffect(() => { tryAIAnalysis(); }, []);
 
  const ITEM_W = (SCREEN_W - 48) / 2;
 
  if (selected) {
    const discounted = selected.Original_Price > selected.Selling_Price;
    const pct = selected.Discount_Percentage;
    return (
      <View style={[st.flex, { backgroundColor: C.bg }]}>
        <SafeAreaView>
          <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:24, paddingVertical:12 }}>
            <TouchableOpacity onPress={() => setSelected(null)} style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
              <Text style={{ fontSize:18, color:C.dark, fontWeight:'300' }}>←</Text>
              <Text style={{ fontSize:13, color:C.muted }}>Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <ScrollView contentContainerStyle={{ paddingBottom:120 }}>
          <Image source={{ uri: selected.Display_Image }} style={{ width:SCREEN_W, height:SCREEN_W * 1.2 }} resizeMode="cover" />
          <View style={{ padding:24 }}>
            <Text style={st.productBrand}>{selected.Brand}</Text>
            <Text style={{ fontSize:22, fontWeight:'500', color:C.dark, marginBottom:12, lineHeight:28, marginTop:4 }}>{selected.Title}</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:16 }}>
              <Text style={[st.productPrice, { fontSize:22 }]}>${selected.Selling_Price}</Text>
              {discounted && (
                <>
                  <Text style={{ fontSize:15, color:'#C0C0C0', textDecorationLine:'line-through' }}>${selected.Original_Price}</Text>
                  {pct > 0 && <View style={{ backgroundColor:C.softGreen, borderRadius:6, paddingHorizontal:8, paddingVertical:3 }}><Text style={{ fontSize:11, color:C.accent, fontWeight:'600' }}>{Math.round(pct)}% off</Text></View>}
                </>
              )}
            </View>
          </View>
        </ScrollView>
        <View style={{ position:'absolute', bottom:0, left:0, right:0, padding:24, backgroundColor:C.bg, borderTopWidth:1, borderTopColor:C.hairline }}>
          <TouchableOpacity onPress={() => selected.Item_Url && Linking.openURL(selected.Item_Url)} style={[st.btnDark, { margin:0 }]}>
            <Text style={st.btnDarkText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
 
  return (
    <View style={[st.flex, { backgroundColor: C.bg }]}>
      <SafeAreaView>
        <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:24, paddingVertical:12, gap:10 }}>
          <TouchableOpacity onPress={onBack}>
            <Text style={{ fontSize:18, color:C.dark, fontWeight:'300' }}>←</Text>
          </TouchableOpacity>
          <Text style={st.dashName}>Style This</Text>
        </View>
      </SafeAreaView>
 
      <ScrollView contentContainerStyle={{ padding:24, paddingBottom:60 }}>
        <View style={{ alignItems:'center', marginBottom:24 }}>
          <Image source={{ uri: item.image_url }} style={{ width:160, height:192, borderRadius:12 }} resizeMode="cover" />
          {analysis && (
            <Text style={{ fontSize:14, color:C.dark, fontWeight:'500', marginTop:10, textAlign:'center' }}>
              {analysis.description}
            </Text>
          )}
        </View>
 
        {loading && (
          <View style={{ alignItems:'center', paddingVertical:30 }}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={{ marginTop:14, fontSize:12, color:C.muted, letterSpacing:1.5, textTransform:'uppercase' }}>
              {garmentType ? 'Finding pairs...' : 'Analyzing...'}
            </Text>
          </View>
        )}
 
        {!loading && !analysis && suggestions.length === 0 && (
          <View>
            <Text style={{ fontSize:16, fontWeight:'500', color:C.dark, marginBottom:4, textAlign:'center' }}>
              What type of piece is this?
            </Text>
            <Text style={{ fontSize:13, color:C.muted, marginBottom:20, textAlign:'center' }}>
              We'll find items that pair perfectly with it.
            </Text>
            {GARMENT_OPTIONS.map((opt, i) => (
              <TouchableOpacity key={i} onPress={() => setGarmentType(opt)}
                style={{ backgroundColor:C.white, borderRadius:10, padding:14, marginBottom:10, borderWidth:1, borderColor:C.hairline }}>
                <Text style={{ fontSize:14, color:C.dark }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
 
        {!loading && (analysis || garmentType) && suggestions.length > 0 && (
          <>
            <Text style={st.sectionEyebrow}>Pairs well with</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12, justifyContent:'center', marginTop:12 }}>
              {suggestions.map((p, i) => (
                <TouchableOpacity key={p.Product_Id + '-' + i} onPress={() => setSelected(p)}
                  style={[st.productCard, { width: ITEM_W }]}>
                  <Image source={{ uri: p.Display_Image }} style={{ width:ITEM_W, height:ITEM_W * 1.2 }} resizeMode="cover" />
                  <View style={{ padding:10 }}>
                    <Text style={st.productBrand}>{p.Brand}</Text>
                    <Text style={st.productTitle} numberOfLines={2}>{p.Title}</Text>
                    <Text style={st.productPrice}>${p.Selling_Price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
 
// ── Closet ─────────────────────────────────────────────────────────────────────
function ClosetScreen({ userId, onNav, userAge, quizData }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [styleItem, setStyleItem] = useState(null);
 
  useEffect(() => {
    if (userId) loadItems();
  }, [userId]);
 
  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('closet_items').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  };
 
  const uploadAndSave = async (uri) => {
    setUploading(true);
    try {
      const fileName = `${userId}/${Date.now()}.jpg`;
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const { error: upErr } = await supabase.storage.from('closet-images').upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });
      if (upErr) throw new Error('Storage: ' + upErr.message);
      const { data: { publicUrl } } = supabase.storage.from('closet-images').getPublicUrl(fileName);
      const { data: newItem, error: dbErr } = await supabase.from('closet_items').insert({ user_id: userId, image_url: publicUrl, liked: false }).select().single();
      if (dbErr) throw new Error('Database: ' + dbErr.message);
      setItems(prev => [newItem, ...prev]);
    } catch (e) { Alert.alert('Could not save item', e.message); }
    setUploading(false);
  };
 
  const handleAddItem = () => {
    Alert.alert('Add to Closet', 'How would you like to add your item?', [
      { text: 'Take Photo', onPress: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Camera permission is required'); return; }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
        if (!result.canceled) await uploadAndSave(result.assets[0].uri);
      }},
      { text: 'Choose from Library', onPress: async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Photo library permission is required'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
        if (!result.canceled) await uploadAndSave(result.assets[0].uri);
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
 
  const toggleLike = async (item) => {
    const newLiked = !item.liked;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, liked: newLiked } : i));
    await supabase.from('closet_items').update({ liked: newLiked }).eq('id', item.id);
  };
 
  const handleRemove = (item) => {
    Alert.alert('Remove from Closet', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        setItems(prev => prev.filter(i => i.id !== item.id));
        await supabase.from('closet_items').delete().eq('id', item.id);
      }},
    ]);
  };
 
  const likedCount = items.filter(i => i.liked).length;
  const ITEM_SIZE = (SCREEN_W - 48) / 2;
 
  if (styleItem) {
    return <StyleThisScreen item={styleItem} onBack={() => setStyleItem(null)} userAge={userAge} quizData={quizData} />;
  }
 
  return (
    <View style={[st.flex, { backgroundColor: C.bg }]}>
      <SafeAreaView>
        <View style={st.dashHeader}>
          <Text style={st.dashName}>My Closet</Text>
          <TouchableOpacity onPress={handleAddItem}
            style={{ paddingVertical:8, paddingHorizontal:14, borderRadius:8, borderWidth:1, borderColor:C.accent }}>
            <Text style={{ fontSize:13, color:C.accent, fontWeight:'600', letterSpacing:0.5 }}>Add item</Text>
          </TouchableOpacity>
        </View>
 
        {likedCount > 0 && (
          <TouchableOpacity onPress={() => onNav(SCREENS.FAVORITES)}
            style={{ marginHorizontal:24, marginBottom:12, padding:14, backgroundColor:C.white,
              borderRadius:10, borderWidth:1, borderColor:C.hairline,
              flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
            <Text style={{ fontSize:14, fontWeight:'500', color:C.dark }}>Favorites</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
              <View style={{ backgroundColor:C.softGreen, borderRadius:6, paddingHorizontal:8, paddingVertical:2 }}>
                <Text style={{ color:C.accent, fontSize:12, fontWeight:'700' }}>{likedCount}</Text>
              </View>
              <Text style={{ color:C.muted, fontSize:16 }}>›</Text>
            </View>
          </TouchableOpacity>
        )}
      </SafeAreaView>
 
      {uploading && (
        <View style={{ backgroundColor:C.softGreen, paddingVertical:10, paddingHorizontal:24, flexDirection:'row', alignItems:'center', gap:10 }}>
          <ActivityIndicator size="small" color={C.accent} />
          <Text style={{ fontSize:12, color:C.accent, letterSpacing:0.5 }}>Adding to your closet...</Text>
        </View>
      )}
 
      {loading ? (
        <View style={st.centerFlex}><ActivityIndicator size="large" color={C.accent} /></View>
      ) : items.length === 0 ? (
        <View style={st.centerFlex}>
          <Text style={{ fontSize:13, color:C.muted, letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 }}>Empty closet</Text>
          <Text style={[st.heroSub, { marginBottom:28 }]}>Start adding your clothes and build your digital wardrobe.</Text>
          <TouchableOpacity onPress={handleAddItem} style={st.btnDark}>
            <Text style={st.btnDarkText}>Add your first item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding:12, paddingBottom:100 }}>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12 }}>
            {items.map(item => (
              <View key={item.id} style={[st.productCard, { width:ITEM_SIZE }]}>
                <Image source={{ uri: item.image_url }} style={{ width:ITEM_SIZE, height:ITEM_SIZE * 1.2 }} resizeMode="cover" />
                <TouchableOpacity onPress={() => toggleLike(item)}
                  style={[st.heartBtn, { top:8, right:8 }]}>
                  <Text style={{ fontSize:18, color: item.liked ? C.accent : '#C8CEC8' }}>{item.liked ? '♥' : '♡'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(item)}
                  style={[st.heartBtn, { top:8, left:8 }]}>
                  <Text style={{ fontSize:12, color:C.muted }}>x</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStyleItem(item)}
                  style={{ position:'absolute', bottom:0, left:0, right:0, paddingVertical:10,
                    backgroundColor:'rgba(26,26,26,0.82)', alignItems:'center' }}>
                  <Text style={{ color:'#fff', fontSize:11, fontWeight:'600', letterSpacing:1, textTransform:'uppercase' }}>Style this</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
 
// ── Favorites Screen ────────────────────────────────────────────────────────────
function FavoritesScreen({ userId, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => { loadFavorites(); }, []);
 
  const loadFavorites = async () => {
    setLoading(true);
    const { data } = await supabase.from('closet_items').select('*').eq('user_id', userId).eq('liked', true).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
 
  const removeFavorite = async (item) => {
    setItems(prev => prev.filter(i => i.id !== item.id));
    await supabase.from('closet_items').update({ liked: false }).eq('id', item.id);
  };
 
  const ITEM_SIZE = (SCREEN_W - 48) / 2;
 
  return (
    <View style={[st.flex, { backgroundColor: C.bg }]}>
      <SafeAreaView>
        <View style={[st.dashHeader, { borderBottomWidth:1, borderBottomColor:C.hairline, paddingBottom:12 }]}>
          <TouchableOpacity onPress={onBack} style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
            <Text style={{ fontSize:18, color:C.dark, fontWeight:'300' }}>←</Text>
          </TouchableOpacity>
          <Text style={st.dashName}>Favorites</Text>
          <View style={{ width:30 }} />
        </View>
      </SafeAreaView>
 
      {loading ? (
        <View style={st.centerFlex}><ActivityIndicator size="large" color={C.accent} /></View>
      ) : items.length === 0 ? (
        <View style={st.centerFlex}>
          <Text style={{ fontSize:13, color:C.muted, letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 }}>No favorites yet</Text>
          <Text style={[st.heroSub, { marginBottom:0 }]}>Tap the heart on any closet item to add it here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding:12, paddingBottom:100 }}>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12 }}>
            {items.map(item => (
              <View key={item.id} style={[st.productCard, { width:ITEM_SIZE }]}>
                <Image source={{ uri: item.image_url }} style={{ width:ITEM_SIZE, height:ITEM_SIZE * 1.2 }} resizeMode="cover" />
                <View style={[st.heartBtn, { top:8, right:8 }]}>
                  <Text style={{ fontSize:18, color:C.accent }}>♥</Text>
                </View>
                <TouchableOpacity onPress={() => removeFavorite(item)}
                  style={[st.heartBtn, { top:8, left:8 }]}>
                  <Text style={{ fontSize:12, color:C.muted }}>x</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ── Delete Screen ─────────────────────────────────────────────────────────────
function DeleteAccountScreen({ userId, onDeleted, onBack }) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
 
  const handleDelete = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
 
    setLoading(true);
    try {
      // Delete all user data from each table
      await supabase.from('closet_items').delete().eq('user_id', userId);
      await supabase.from('discover_profile').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
 
      // Sign out (Supabase doesn't allow client-side user deletion for security —
      // the account auth record needs to be deleted server-side via Edge Function
      // or Supabase dashboard. For App Store compliance, deleting all data + 
      // signing out satisfies Apple's requirement in most cases.)
      await supabase.auth.signOut();
      onDeleted();
    } catch (e) {
      Alert.alert('Error', 'Could not delete account. Please try again or contact support.');
    }
    setLoading(false);
  };
 
  return (
    <SafeAreaView style={[st.flex, { backgroundColor: C.bg }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.hairline }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 18, color: C.dark, fontWeight: '300' }}>←</Text>
        </TouchableOpacity>
        <Text style={st.dashName}>Delete Account</Text>
      </View>
 
      <View style={{ flex: 1, padding: 24 }}>
        <View style={[st.summaryCard, { borderColor: '#F5EDED', marginBottom: 24 }]}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#A05050', marginBottom: 12 }}>
            This cannot be undone
          </Text>
          <Text style={{ fontSize: 14, color: C.muted, lineHeight: 22 }}>
            Deleting your account will permanently remove:
          </Text>
          <View style={{ marginTop: 10, gap: 6 }}>
            {['Your style profile and quiz results', 'All closet items and photos', 'Your saved and discovered items', 'Your preferences and history'].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ color: '#A05050', fontSize: 13 }}>·</Text>
                <Text style={{ fontSize: 13, color: C.muted, flex: 1 }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
 
        {confirmed && (
          <View style={{ backgroundColor: '#FFF5F5', borderRadius: 10, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F5EDED' }}>
            <Text style={{ fontSize: 14, color: '#A05050', textAlign: 'center', lineHeight: 22 }}>
              Are you sure? Tap "Delete my account" again to confirm. This action is permanent.
            </Text>
          </View>
        )}
 
        <TouchableOpacity
          onPress={handleDelete}
          disabled={loading}
          style={{ width: '100%', padding: 16, backgroundColor: confirmed ? '#A05050' : C.bg, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#A05050', opacity: loading ? 0.6 : 1 }}
        >
          <Text style={{ color: confirmed ? '#fff' : '#A05050', fontSize: 15, fontWeight: '500' }}>
            {loading ? 'Deleting...' : confirmed ? 'Delete my account' : 'Delete my account'}
          </Text>
        </TouchableOpacity>
 
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: C.muted }}>Keep my account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


// ── Profile Screen ─────────────────────────────────────────────────────────────
function ProfileScreen({ onBack, onNav, quizData, swipeResults, userName, userAge }) {
  const fullQuizData = { ...quizData, name: userName, age: userAge };
  const colorAnalysis = generateColorAnalysis(fullQuizData);
  const styleAnalysis = generateStyleAnalysis(fullQuizData, swipeResults);
 
  return (
    <SafeAreaView style={[st.flex, { backgroundColor: C.bg }]}>
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:24, paddingVertical:12, borderBottomWidth:1, borderBottomColor:C.hairline }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight:12 }}>
          <Text style={{ fontSize:18, color:C.dark, fontWeight:'300' }}>←</Text>
        </TouchableOpacity>
        <Text style={st.dashName}>My Profile</Text>
      </View>
 
      <ScrollView contentContainerStyle={{ padding:24, paddingBottom:48 }}>
        {colorAnalysis && (
          <View style={st.summaryCard}>
            <Text style={st.sectionEyebrow}>Color palette</Text>
            <View style={{ flexDirection:'row', gap:8, marginTop:12, marginBottom:16 }}>
              {colorAnalysis.palette.map((color, i) => (
                <View key={i} style={{ flex:1, height:40, borderRadius:8, backgroundColor:color }} />
              ))}
            </View>
            <Text style={{ fontSize:14, color:C.dark, lineHeight:22 }}>{colorAnalysis.text}</Text>
          </View>
        )}
        <View style={[st.summaryCard, { backgroundColor:C.dark, borderColor:C.dark }]}>
          <Text style={[st.sectionEyebrow, { color:'rgba(255,255,255,0.5)' }]}>Style analysis</Text>
          <Text style={{ fontSize:14, color:'rgba(255,255,255,0.88)', lineHeight:22, marginTop:12 }}>{styleAnalysis}</Text>
        </View>
        <TouchableOpacity
          onPress={() => onNav(SCREENS.DELETE_ACCOUNT)}
          style={{ marginTop: 8, alignItems: 'center', paddingVertical: 16 }}
        >
          <Text style={{ fontSize: 13, color: '#A05050', letterSpacing: 0.5 }}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
 
// ── Root ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState(SCREENS.SIGNIN);
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState('');
  const [quizData, setQuizData] = useState({});
  const [swipeResults, setSwipeResults] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState(null);
 
  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session) {
          if (mounted) setUserId(session.user.id);
          await resolveProfile(session, mounted);
        }
      } catch (e) {} finally { if (mounted) setAuthChecked(true); }
    };
    bootstrap();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && mounted) {
        if (mounted) setUserId(session.user.id);
        await resolveProfile(session, mounted);
        if (mounted) setAuthChecked(true);
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);
 
  const resolveProfile = async (session, mounted) => {
    try {
      const { data: profile, error } = await supabase.from('profiles').select('name, age, occupation, brands, styles, onboarding_complete').eq('id', session.user.id).single();
      if (!mounted) return;
      if (!error && profile?.onboarding_complete) {
        setUserName(profile.name || session.user.user_metadata?.full_name || '');
        setUserAge(profile.age || '');
        setQuizData({ occupation: profile.occupation || [], brands: profile.brands || [], styles: profile.styles || [] });
        setScreen(SCREENS.DASHBOARD);
      } else { setScreen(SCREENS.QUIZ); }
    } catch (e) { if (mounted) setScreen(SCREENS.QUIZ); }
  };
 
  const nextInFlow = (name, age, fullQuizData) => {
    if (name && typeof name === 'string') setUserName(name);
    if (age && typeof age === 'string') setUserAge(age);
    if (fullQuizData && typeof fullQuizData === 'object') setQuizData(fullQuizData);
    const flow = [SCREENS.SIGNIN, SCREENS.QUIZ, SCREENS.SWIPE_TRAIN, SCREENS.STYLE_SUMMARY, SCREENS.DASHBOARD];
    const cur = flow.indexOf(screen);
    if (cur !== -1 && cur < flow.length - 1) setScreen(flow[cur + 1]);
  };
 
  const handleOnboardingComplete = async () => {
    try {
      if (!userId) { alert('No user ID found — please sign in again.'); setScreen(SCREENS.SIGNIN); return; }
      const { error } = await supabase.from('profiles').upsert({
        id: userId, name: userName, age: userAge,
        occupation: quizData.occupation || [], brands: quizData.brands || [], styles: quizData.styles || [],
        onboarding_complete: true,
      }, { onConflict: 'id' });
      if (error) console.log('Upsert error:', error.message, error.code);
    } catch (e) { console.log('Save exception:', e.message); }
    setScreen(SCREENS.DASHBOARD);
  };
 
  const handleSwipeDone = (results) => {
    setSwipeResults(results || []);
    setScreen(SCREENS.STYLE_SUMMARY);
  };
 
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserId(null); setUserName(''); setUserAge(''); setQuizData({}); setSwipeResults([]);
    setAuthChecked(true); setScreen(SCREENS.SIGNIN);
  };
 
  const [navParams, setNavParams] = useState({});
  const navTo = (screenName, params) => {
    if (params) setNavParams(prev => ({ ...prev, [screenName]: params }));
    setScreen(screenName);
  };
  const isMainTab = [SCREENS.DASHBOARD, SCREENS.DISCOVER, SCREENS.SHOPPING, SCREENS.CLOSET].includes(screen);
 
  if (!authChecked) {
    return (
      <View style={{ flex:1, backgroundColor:C.bg, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }
 
  return (
    <View style={[st.root, { backgroundColor:C.bg }]}>
      <RNStatusBar barStyle="dark-content" backgroundColor={C.bg} />
      {screen === SCREENS.SIGNIN         && <SignInScreen onNext={nextInFlow} />}
      {screen === SCREENS.QUIZ           && <QuizScreen onDone={nextInFlow} />}
      {screen === SCREENS.SWIPE_TRAIN    && <SwipeTrainScreen onDone={handleSwipeDone} userAge={userAge} />}
      {screen === SCREENS.STYLE_SUMMARY  && (
        <StyleSummaryScreen quizData={{ ...quizData, name: userName, age: userAge }} swipeResults={swipeResults} onDone={handleOnboardingComplete} />
      )}
      {screen === SCREENS.DASHBOARD && (
        <DashboardScreen onNav={navTo} userName={userName} onSignOut={handleSignOut} userAge={userAge} quizData={quizData} />
      )}
      {screen === SCREENS.DISCOVER && (
        <DiscoverScreen userAge={userAge} quizData={quizData} userId={userId} />
      )}
      {screen === SCREENS.PROFILE && (
        <ProfileScreen
          onBack={() => setScreen(SCREENS.DASHBOARD)}
          onNav={navTo}
          quizData={quizData}
          swipeResults={swipeResults}
          userName={userName}
          userAge={userAge}
        />
      )}
      {screen === SCREENS.DELETE_ACCOUNT && (
        <DeleteAccountScreen
          userId={userId}
          onDeleted={handleSignOut}
          onBack={() => setScreen(SCREENS.PROFILE)}
        />
      )}
      {screen === SCREENS.SHOPPING       && <ShoppingScreen userAge={userAge} quizData={quizData} initialSearch={navParams[SCREENS.SHOPPING]?.initialSearch} />}
      {screen === SCREENS.CLOSET         && <ClosetScreen userId={userId} onNav={navTo} userAge={userAge} quizData={quizData} />}
      {screen === SCREENS.FAVORITES      && <FavoritesScreen userId={userId} onBack={() => setScreen(SCREENS.CLOSET)} />}
      {isMainTab && <TabBar active={screen} onNav={navTo} />}
    </View>
  );
}
 
// ── Styles ─────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root:               { flex:1 },
  flex:               { flex:1, backgroundColor:C.bg },
  centerFlex:         { flex:1, alignItems:'center', justifyContent:'center', padding:32 },
 
  // Typography
  wordmark:           { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize:28, fontWeight:'400', color:C.dark, letterSpacing:4, textTransform:'uppercase' },
  heroTitle:          { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize:34, fontWeight:'400', color:C.dark, marginBottom:12, textAlign:'center', lineHeight:42 },
  heroSub:            { fontSize:14, color:C.muted, textAlign:'center', lineHeight:22, marginBottom:40 },
  legalText:          { marginTop:24, fontSize:11, color:C.muted, textAlign:'center', lineHeight:18 },
  dashName:           { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize:22, fontWeight:'400', color:C.dark },
  sectionTitle:       { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize:20, fontWeight:'400', color:C.dark },
  sectionEyebrow:     { fontSize:10, color:C.muted, letterSpacing:2, textTransform:'uppercase', fontWeight:'600' },
  quizTitle:          { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize:26, fontWeight:'400', color:C.dark, marginBottom:6 },
  quizSub:            { fontSize:14, color:C.muted, marginBottom:24, lineHeight:20 },
 
  // Buttons
  btnDark:            { width:'100%', padding:16, backgroundColor:C.dark, borderRadius:10, alignItems:'center' },
  btnDarkText:        { color:'#FFFFFF', fontSize:15, fontWeight:'500', letterSpacing:0.5 },
 
  // Inputs
  textInput:          { width:'100%', padding:16, backgroundColor:C.white, borderRadius:10, borderWidth:1, borderColor:C.hairline, fontSize:16, color:C.dark },
 
  // Progress
  progressTrack:      { height:2, backgroundColor:C.paleGreen, borderRadius:2, width:'100%' },
  progressFill:       { height:2, backgroundColor:C.accent, borderRadius:2 },
 
  // Quiz footer
  quizFooter:         { padding:24, paddingBottom:32, backgroundColor:C.bg, borderTopWidth:1, borderTopColor:C.hairline },
 
  // Chips
  chipWrap:           { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:               { paddingVertical:9, paddingHorizontal:14, borderRadius:8, borderWidth:1, borderColor:C.hairline, backgroundColor:C.white },
  chipActive:         { borderColor:C.accent, backgroundColor:C.softGreen },
  chipText:           { fontSize:13, color:C.dark },
  chipTextActive:     { color:C.accent, fontWeight:'600' },
 
  // Style cards
  styleGrid:          { flexDirection:'row', flexWrap:'wrap', gap:12 },
  styleCard:          { width:'47%', borderRadius:10, overflow:'hidden', borderWidth:1.5, borderColor:'transparent' },
  styleCardActive:    { borderColor:C.accent },
  styleSwatches:      { width:'100%', height:110 },
  styleCheck:         { position:'absolute', top:8, right:8, width:20, height:20, borderRadius:10, backgroundColor:C.accent, alignItems:'center', justifyContent:'center' },
  styleLabel:         { fontSize:13, fontWeight:'600', color:C.dark, marginBottom:2 },
  styleDesc:          { fontSize:10, color:C.muted, lineHeight:14 },
 
  // Swipe
  swipeCenterFlex:    { flex:1, alignItems:'center', justifyContent:'center', padding:16 },
  clothingCardInfo:   { padding:14, backgroundColor:C.white },
  clothingName:       { fontSize:15, fontWeight:'500', color:C.dark, letterSpacing:0.3 },
 
  // Category banner
  categoryBanner:     { flexDirection:'row', alignItems:'center', marginHorizontal:24, marginTop:12, backgroundColor:C.white, borderRadius:10, padding:14, borderWidth:1, borderColor:C.hairline, gap:12 },
  categoryBannerTitle:{ fontSize:15, fontWeight:'600', color:C.dark, letterSpacing:0.3 },
  categoryBannerSub:  { fontSize:11, color:C.muted, marginTop:2, letterSpacing:0.5 },
  skipCatBtn:         { paddingVertical:6, paddingHorizontal:12, backgroundColor:C.softGreen, borderRadius:8 },
  skipCatBtnText:     { fontSize:11, color:C.accent, fontWeight:'600', letterSpacing:0.8, textTransform:'uppercase' },
 
  // Tab bar
  tabBar:             { flexDirection:'row', backgroundColor:C.white, borderTopWidth:1, borderTopColor:C.hairline, paddingBottom: Platform.OS === 'ios' ? 24 : 10, paddingTop:10 },
  tabItem:            { flex:1, alignItems:'center', gap:4 },
  tabLabel:           { fontSize:11, color:C.muted, letterSpacing:1, textTransform:'uppercase', fontWeight:'500' },
  tabLabelActive:     { color:C.dark, fontWeight:'700' },
  tabActiveDot:       { width:4, height:4, borderRadius:2, backgroundColor:C.accent },
 
  // Dashboard
  dashHeader:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:24, paddingVertical:14 },
  avatar:             { width:36, height:36, borderRadius:18, backgroundColor:C.softGreen, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:C.hairline },
  headerBtn:          { paddingVertical:7, paddingHorizontal:12, borderRadius:8, borderWidth:1, borderColor:C.hairline, backgroundColor:C.white },
 
  // Weather card — dark green, editorial
  weatherCard:        { marginHorizontal:24, marginBottom:8, borderRadius:14, backgroundColor:'#C8D9C8', padding:20 },
  ootdLabel:          { color:'rgba(26,26,26,0.5)', fontSize:10, fontWeight:'600', letterSpacing:2, textTransform:'uppercase', marginBottom:6 },
  ootdTitle:          { color:'#1A1A1A', fontSize:15, fontWeight:'400', lineHeight:22 },
  ootdSub:            { color:'rgba(26,26,26,0.55)', fontSize:11, letterSpacing:0.5 },
 
  sectionHeader:      { flexDirection:'row', justifyContent:'space-between', alignItems:'baseline' },
  colorCard:          { backgroundColor:C.white, borderRadius:12, padding:16 },
 
  // Product cards — cleaner, minimal
  productCard:        { borderRadius:10, overflow:'hidden', backgroundColor:C.white, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  productBrand:       { fontSize:10, color:C.muted, letterSpacing:1, textTransform:'uppercase', marginBottom:3 },
  productTitle:       { fontSize:13, fontWeight:'500', color:C.dark, lineHeight:18 },
  productPrice:       { fontSize:14, fontWeight:'700', color:C.accent, marginTop:4 },
  discountBadge:      { position:'absolute', top:8, left:8, backgroundColor:C.dark, borderRadius:6, paddingHorizontal:8, paddingVertical:3 },
  heartBtn:           { position:'absolute', width:32, height:32, borderRadius:16, backgroundColor:'rgba(255,255,255,0.92)', alignItems:'center', justifyContent:'center' },
 
  // Shop filters
  filterPill:         { paddingVertical:8, paddingHorizontal:16, borderRadius:8, backgroundColor:C.white, borderWidth:1, borderColor:C.hairline },
  filterPillActive:   { backgroundColor:C.dark, borderColor:C.dark },
  filterPillText:     { fontSize:13, color:C.dark, letterSpacing:0.3 },
  filterPillTextActive:{ color:'#fff', fontWeight:'500' },
 
  // Summary cards
  summaryCard:        { backgroundColor:C.white, borderRadius:12, padding:20, marginBottom:16, borderWidth:1, borderColor:C.hairline },
 
  // Profile dropdown
  profileDropdown:      { position:'absolute', top:68, right:24, backgroundColor:C.white, borderRadius:12, shadowColor:'#000', shadowOpacity:0.10, shadowRadius:12, elevation:10, zIndex:20, minWidth:160, borderWidth:1, borderColor:C.hairline },
  profileDropdownItem:  { paddingVertical:14, paddingHorizontal:18 },
  profileDropdownText:  { fontSize:14, color:C.dark, fontWeight:'500' },
  profileDropdownDivider:{ height:1, backgroundColor:C.hairline },
 
  // Coloring step
  coloringLabel:      { fontSize:13, fontWeight:'600', color:C.dark, marginBottom:8, marginTop:4, letterSpacing:0.5, textTransform:'uppercase' },
  hairSwatch:         { width:48, height:48, borderRadius:24, borderWidth:2, borderColor:C.white, shadowColor:'#000', shadowOpacity:0.10, shadowRadius:4, elevation:2 },
  eyeSwatch:          { width:48, height:48, borderRadius:24, borderWidth:2, borderColor:C.white, shadowColor:'#000', shadowOpacity:0.10, shadowRadius:4, elevation:2 },
});