from fastapi import APIRouter
from pydantic import BaseModel
import re

router = APIRouter()

def strip_emojis(text: str) -> str:
    return re.sub(r'[\U00010000-\U0010ffff\U00002600-\U000027BF\U0001F300-\U0001FAFF]', '', text).strip()

def clean(items: list) -> list:
    return [strip_emojis(i) for i in items]

class WeatherData(BaseModel):
    temp: float
    humidity: float
    wind_speed: float
    pressure: float
    description: str
    location: str
    lang: str = "en"  # "en" or "mr"

def rule_based_en(data: WeatherData) -> dict:
    t = data.temp
    h = data.humidity
    w = data.wind_speed
    p = data.pressure
    desc = data.description.lower()
    is_rain = any(x in desc for x in ["rain", "drizzle", "shower", "storm", "thunder"])
    is_storm = any(x in desc for x in ["storm", "thunder", "squall"])
    is_clear = any(x in desc for x in ["clear", "sunny", "fair"])

    farmers, business, residents, riverside, heat_alert = [], [], [], [], []

    farmers.append(f"Good morning, farmer! Today in {data.location} it is {round(t)}C with {desc}. Here is your field plan:")
    if is_rain:
        farmers.append("Rain is here — hold off on pesticide or fertilizer spraying today. Chemicals wash away and harm your soil.")
        farmers.append("Your crops are getting natural water — skip irrigation today and save water for drier days ahead.")
        farmers.append("Keep heavy machinery off wet fields to avoid soil compaction. Use this time to repair tools.")
    elif is_storm:
        farmers.append("Storm warning! Secure all loose equipment, nets, and greenhouse covers right now.")
        farmers.append("Move young seedlings or nursery plants to a sheltered area immediately.")
        farmers.append("Harvest anything that is ready — do not risk losing mature crops to storm damage.")
    elif t > 38:
        farmers.append("Extreme heat today — irrigate early morning before 7am or after sunset to minimize evaporation.")
        farmers.append("Watch for wilting leaves. Mulch around plants to retain soil moisture.")
        farmers.append("Limit fieldwork to early morning and evening. Drink water every 20 minutes if working outside.")
        heat_alert.append("Dangerous heat for outdoor workers. Take breaks in shade every 30 minutes.")
    elif t < 10:
        farmers.append("Cold snap alert! Cover frost-sensitive crops like tomatoes and leafy greens with cloth tonight.")
        farmers.append("Delay any new sowing — seeds will not germinate well in cold soil below 15C.")
        farmers.append("Reduce irrigation — cold and wet soil invites root rot.")
    elif h > 80:
        farmers.append("High humidity today — perfect breeding ground for fungal diseases. Inspect your crops closely.")
        farmers.append("Apply a preventive fungicide spray on tomatoes, grapes, and wheat.")
        farmers.append("Ensure good airflow between plants — prune dense foliage to reduce moisture buildup.")
    elif is_clear and 20 <= t <= 32:
        farmers.append("Perfect farming weather today. Great conditions for spraying, harvesting, and field operations.")
        farmers.append("Ideal day for transplanting seedlings — mild temperature means less transplant shock.")
        farmers.append("Get your machinery out — this is your window for ploughing, sowing, or harvesting.")
    else:
        farmers.append("Moderate conditions today. A good day for routine field inspection and maintenance.")
        farmers.append("Check soil moisture levels and plan your irrigation schedule for the week ahead.")
        farmers.append("Scout for pests and diseases — early detection saves your entire crop.")
    if w > 15:
        farmers.append("Very strong winds — stake tall crops like corn and sunflowers to prevent lodging.")
    elif w > 8:
        farmers.append("Moderate winds — avoid spraying today as chemicals will drift.")

    business.append(f"Business heads up for {data.location} today — {round(t)}C, {desc}. Plan your operations smartly:")
    if is_storm:
        business.append("Storm incoming — reschedule all outdoor events and field operations. Safety first.")
        business.append("Secure outdoor inventory and signage. Storm damage claims are expensive.")
        business.append("Alert your logistics team — delivery routes may be disrupted.")
        business.append("Brief your team to work remotely if possible.")
    elif is_rain:
        business.append("Rainy day — foot traffic to physical stores will drop. Push your online channels hard today.")
        business.append("Logistics teams: expect delays. Add buffer time to all ETAs and inform customers in advance.")
        business.append("Restaurants and retail shops — put out dry mats and warm lighting. Make customers feel welcome.")
        business.append("Use this slower day for team meetings, inventory audits, or strategy planning.")
    elif t > 38:
        business.append("Extreme heat — mandatory water breaks every 30 minutes for outdoor staff.")
        business.append("Check cold storage temperatures twice today — heat spikes can spoil inventory fast.")
        business.append("Expect higher electricity bills from AC usage. Shift heavy operations to cooler morning hours.")
        business.append("Retail opportunity: promote cold drinks and cooling products — demand is high today.")
    elif t < 10:
        business.append("Cold weather — ensure outdoor staff have proper gear. Cold illness means lost productivity.")
        business.append("Delivery teams: check vehicle batteries and tyre pressure before dispatch.")
        business.append("Hospitality businesses: push hot beverages and comfort food. People crave warmth.")
        business.append("Construction managers: assess if outdoor work can safely continue.")
    elif is_clear and 20 <= t <= 30:
        business.append("Beautiful day — great for outdoor meetings, site visits, and team events.")
        business.append("Foot traffic will be high for retail and hospitality. Staff up accordingly.")
        business.append("Perfect weather for networking events or outdoor launches.")
    else:
        business.append("Stable conditions today — a solid day for operations and client calls.")
        business.append("Good day to review supply chain status and restock inventory.")
        business.append("Moderate weather means moderate foot traffic. Focus on customer experience today.")
    if h > 85:
        business.append("Very high humidity — check that electronics and moisture-sensitive inventory are properly stored.")

    if is_storm:
        residents.append("Stay indoors — this is serious weather. Avoid travel unless absolutely necessary.")
        residents.append("Keep a torch, power bank, and emergency kit ready in case of power cuts.")
        residents.append("Keep your phone charged and stay updated on local weather alerts.")
    elif is_rain:
        residents.append("Carry an umbrella and wear waterproof footwear before stepping out.")
        residents.append("Allow extra travel time — roads will be slippery and traffic slower than usual.")
        residents.append("Great day to stay in, cook something warm, and catch up on rest.")
    elif t > 38:
        residents.append("Dangerous heat — stay indoors between 11am and 4pm. Drink at least 3 litres of water today.")
        residents.append("Apply SPF 50+ sunscreen if going out. UV levels are extreme.")
        residents.append("Check on elderly neighbours and family members — they are most vulnerable to heat stroke.")
        heat_alert.append("Heat emergency level. Avoid strenuous outdoor activity. Seek shade or AC if feeling dizzy.")
    elif t < 10:
        residents.append("Layer up before going out — it is genuinely cold today.")
        residents.append("Cold and flu season is active. Wash hands frequently.")
        residents.append("Warm meals and hot drinks will do wonders today.")
    elif is_clear:
        residents.append("Lovely day outside. Great for a walk, outdoor exercise, or soaking up some vitamin D.")
        residents.append("Perfect weather for outdoor plans — parks, markets, or a picnic.")
        residents.append("Do not forget sunscreen even on pleasant days — UV rays are always present.")
    else:
        residents.append("Comfortable day ahead. Dress in light layers to adapt to temperature changes.")
        residents.append("Good conditions for your daily commute and outdoor activities.")
        residents.append("Keep an eye on weather updates — conditions can shift through the day.")

    if is_storm or p < 995:
        riverside.append("High flood risk — move valuables to higher floors immediately if you live near a river.")
        riverside.append("Do not attempt to cross flooded roads or rivers — even shallow fast-moving water is deadly.")
        riverside.append("Keep emergency contacts on speed dial.")
    elif is_rain and p < 1005:
        riverside.append("River levels may rise over the next few hours. Monitor local flood alerts closely.")
        riverside.append("Keep sandbags or barriers ready if your property has flooded before.")
        riverside.append("Avoid riverside walks and recreational activities until the rain passes.")
    elif is_rain:
        riverside.append("Moderate rain — river levels will rise slightly. Avoid swimming or boating today.")
        riverside.append("Keep an eye on water levels if you live close to the riverbank.")
    else:
        riverside.append("River conditions appear calm and stable today.")
        riverside.append("Good conditions for riverside activities — but stay aware of sudden weather changes.")
        riverside.append("Enjoy the riverside responsibly — keep it clean for everyone.")

    return {
        "farmers": clean(farmers),
        "business": clean(business),
        "residents": clean(residents),
        "riverside": clean(riverside),
        "heat_alert": clean(heat_alert),
    }


def rule_based_mr(data: WeatherData) -> dict:
    t = data.temp
    h = data.humidity
    w = data.wind_speed
    p = data.pressure
    desc = data.description.lower()
    is_rain = any(x in desc for x in ["rain", "drizzle", "shower", "storm", "thunder"])
    is_storm = any(x in desc for x in ["storm", "thunder", "squall"])
    is_clear = any(x in desc for x in ["clear", "sunny", "fair"])

    farmers, business, residents, riverside, heat_alert = [], [], [], [], []

    farmers.append(f"शेतकरी बंधू, {data.location} मध्ये आज तापमान {round(t)} अंश सेल्सिअस आहे आणि हवामान {desc} आहे. आजचा शेत-कार्यक्रम:")
    if is_rain:
        farmers.append("पाऊस पडत आहे — आज कीटकनाशक किंवा खत फवारणी करू नका. रसायने जमिनीत वाहून जातात.")
        farmers.append("पिकांना नैसर्गिक पाणी मिळत आहे — आज सिंचन बंद ठेवा आणि पाणी वाचवा.")
        farmers.append("ओल्या शेतात जड यंत्रे नेऊ नका — माती दाबली जाते. हा वेळ अवजारे दुरुस्त करण्यासाठी वापरा.")
    elif is_storm:
        farmers.append("वादळाचा इशारा! सर्व सैल उपकरणे, जाळ्या आणि हरितगृहाचे आवरण आत्ताच सुरक्षित करा.")
        farmers.append("लहान रोपे किंवा नर्सरीतील झाडे ताबडतोब सुरक्षित ठिकाणी हलवा.")
        farmers.append("तयार असलेले पीक आत्ताच काढा — वादळात नुकसान होण्याचा धोका आहे.")
    elif t > 38:
        farmers.append("अत्यंत उष्णता — पिकांना सकाळी ७ च्या आधी किंवा सूर्यास्तानंतर पाणी द्या.")
        farmers.append("कोमेजलेली पाने पाहा — ते पाण्याची गरज दर्शवतात. ओलावा टिकवण्यासाठी आच्छादन वापरा.")
        farmers.append("शेतात काम सकाळी लवकर किंवा संध्याकाळी करा. दर २० मिनिटांनी पाणी प्या.")
        heat_alert.append("बाहेर काम करणाऱ्यांसाठी धोकादायक उष्णता. दर ३० मिनिटांनी सावलीत विश्रांती घ्या.")
    elif t < 10:
        farmers.append("थंडीचा इशारा! टोमॅटो, मिरची आणि पालेभाज्यांवर आज रात्री कापड किंवा प्लास्टिक झाकण ठेवा.")
        farmers.append("नवीन पेरणी थांबवा — थंड मातीत बियाणे उगवत नाही. तापमान १५ अंशांवर जाईपर्यंत थांबा.")
        farmers.append("सिंचन कमी करा — थंड आणि ओली माती मुळे कुजण्यास कारणीभूत ठरते.")
    elif h > 80:
        farmers.append("आज आर्द्रता जास्त आहे — बुरशीजन्य रोगांचा धोका आहे. पिकांची जवळून तपासणी करा.")
        farmers.append("टोमॅटो, द्राक्षे आणि गव्हावर बुरशीनाशक फवारणी करा.")
        farmers.append("झाडांमध्ये हवा खेळती राहील याची काळजी घ्या — दाट पाने छाटा.")
    elif is_clear and 20 <= t <= 32:
        farmers.append("आज शेतीसाठी उत्तम हवामान आहे. फवारणी, कापणी आणि शेत-कामांसाठी योग्य दिवस.")
        farmers.append("रोपे लावण्यासाठी आदर्श दिवस — सौम्य तापमानामुळे रोपांना धक्का बसत नाही.")
        farmers.append("यंत्रे बाहेर काढा — नांगरणी, पेरणी किंवा कापणीसाठी हा योग्य वेळ आहे.")
    else:
        farmers.append("आज मध्यम हवामान आहे. शेताची नियमित तपासणी आणि देखभालीसाठी चांगला दिवस.")
        farmers.append("मातीतील ओलावा तपासा आणि पुढील आठवड्याचे सिंचन नियोजन करा.")
        farmers.append("कीड आणि रोगांसाठी शेत तपासा — लवकर ओळख संपूर्ण पीक वाचवते.")
    if w > 15:
        farmers.append("खूप जोरदार वारे — मका आणि सूर्यफुलासारख्या उंच पिकांना आधार द्या.")
    elif w > 8:
        farmers.append("मध्यम वारे — आज फवारणी टाळा कारण रसायने वाहून जातात.")

    business.append(f"{data.location} मधील व्यावसायिकांसाठी आजचा इशारा — {round(t)} अंश, {desc}. आजचे नियोजन:")
    if is_storm:
        business.append("वादळ येत आहे — सर्व बाहेरील कार्यक्रम आणि साइट भेटी रद्द करा. सुरक्षितता प्रथम.")
        business.append("बाहेरील माल, फलक आणि उपकरणे सुरक्षित करा.")
        business.append("लॉजिस्टिक्स टीमला सतर्क करा — डिलिव्हरी मार्ग विस्कळीत होऊ शकतात.")
        business.append("शक्य असल्यास कर्मचाऱ्यांना घरून काम करण्यास सांगा.")
    elif is_rain:
        business.append("पावसाळी दिवस — दुकानांमध्ये गर्दी कमी होईल. आज ऑनलाइन चॅनेल जोरदार वापरा.")
        business.append("डिलिव्हरी टीम: उशीर अपेक्षित आहे. ग्राहकांना आधीच कळवा.")
        business.append("हॉटेल आणि दुकानांमध्ये कोरडे मॅट आणि उबदार वातावरण ठेवा.")
        business.append("हा शांत दिवस टीम मीटिंग, इन्व्हेंटरी तपासणी किंवा प्रशिक्षणासाठी वापरा.")
    elif t > 38:
        business.append("अत्यंत उष्णता — बाहेर काम करणाऱ्या कर्मचाऱ्यांना दर ३० मिनिटांनी पाणी द्या.")
        business.append("खाद्यपदार्थ व्यवसायात शीतगृहाचे तापमान दोनदा तपासा.")
        business.append("वीज बिल जास्त येईल. जड काम सकाळी लवकर करा.")
        business.append("थंड पेये आणि उन्हाळी उत्पादनांची मागणी जास्त आहे — त्याचा फायदा घ्या.")
    elif t < 10:
        business.append("थंड हवामान — बाहेरील कर्मचाऱ्यांना योग्य कपडे द्या.")
        business.append("वाहन चालकांनी बॅटरी आणि टायर प्रेशर तपासावे.")
        business.append("हॉटेल व्यवसाय: गरम पेये आणि सूप यांची जाहिरात करा.")
        business.append("बांधकाम व्यवस्थापकांनी बाहेरील काम सुरक्षितपणे होऊ शकते का ते तपासावे.")
    elif is_clear and 20 <= t <= 30:
        business.append("सुंदर दिवस — बाहेरील बैठका, साइट भेटी आणि टीम इव्हेंटसाठी उत्तम.")
        business.append("किरकोळ आणि हॉटेल व्यवसायात गर्दी जास्त असेल. कर्मचारी तयार ठेवा.")
        business.append("नेटवर्किंग इव्हेंट किंवा बाहेरील लॉन्चसाठी परिपूर्ण हवामान.")
    else:
        business.append("आज स्थिर परिस्थिती आहे — कामकाज आणि क्लायंट कॉलसाठी चांगला दिवस.")
        business.append("पुरवठा साखळी तपासा आणि हवामान बदलण्यापूर्वी माल भरून घ्या.")
        business.append("मध्यम हवामान म्हणजे मध्यम गर्दी. ग्राहक सेवेवर लक्ष केंद्रित करा.")
    if h > 85:
        business.append("खूप जास्त आर्द्रता — इलेक्ट्रॉनिक्स आणि कागदपत्रे योग्य ठिकाणी ठेवा.")

    if is_storm:
        residents.append("घरात राहा — हे गंभीर हवामान आहे. अत्यंत आवश्यक असल्याशिवाय प्रवास टाळा.")
        residents.append("टॉर्च, पॉवर बँक आणि आपत्कालीन किट तयार ठेवा.")
        residents.append("फोन चार्ज ठेवा आणि स्थानिक हवामान इशाऱ्यांवर लक्ष ठेवा.")
    elif is_rain:
        residents.append("बाहेर जाताना छत्री आणि वॉटरप्रूफ पादत्राणे घ्या.")
        residents.append("प्रवासासाठी जास्त वेळ ठेवा — रस्ते निसरडे असतील.")
        residents.append("घरात राहणे, गरम जेवण बनवणे आणि विश्रांती घेणे उत्तम.")
    elif t > 38:
        residents.append("धोकादायक उष्णता — सकाळी ११ ते दुपारी ४ दरम्यान घरात राहा. आज किमान ३ लिटर पाणी प्या.")
        residents.append("बाहेर जाताना SPF ५०+ सनस्क्रीन लावा. UV किरण खूप तीव्र आहेत.")
        residents.append("वृद्ध शेजारी आणि कुटुंबातील सदस्यांची काळजी घ्या — त्यांना उष्माघाताचा धोका जास्त आहे.")
        heat_alert.append("उष्णतेची आणीबाणी. जड शारीरिक काम टाळा. चक्कर आल्यास ताबडतोब सावलीत जा.")
    elif t < 10:
        residents.append("बाहेर जाण्यापूर्वी उबदार कपडे घाला — आज खरोखरच थंडी आहे.")
        residents.append("सर्दी आणि फ्लूचा हंगाम आहे. वारंवार हात धुवा.")
        residents.append("गरम जेवण आणि गरम पेये आज खूप उपयुक्त ठरतील.")
    elif is_clear:
        residents.append("बाहेर सुंदर दिवस आहे. फिरायला जाणे, व्यायाम करणे किंवा उन्हात बसणे उत्तम.")
        residents.append("बाहेरील योजनांसाठी परिपूर्ण हवामान — उद्याने, बाजार किंवा पिकनिक.")
        residents.append("सुखद दिवसातही सनस्क्रीन लावायला विसरू नका.")
    else:
        residents.append("आज आरामदायक दिवस आहे. तापमान बदलांसाठी हलके थर घाला.")
        residents.append("दैनंदिन प्रवास आणि बाहेरील कामांसाठी चांगल्या परिस्थिती आहेत.")
        residents.append("हवामान अपडेटवर लक्ष ठेवा — दिवसभरात परिस्थिती बदलू शकते.")

    if is_storm or p < 995:
        riverside.append("पूराचा उच्च धोका — नदीजवळ राहत असल्यास मौल्यवान वस्तू वरच्या मजल्यावर हलवा.")
        riverside.append("पूरग्रस्त रस्ते किंवा नद्या ओलांडण्याचा प्रयत्न करू नका — उथळ वेगवान पाणीही प्राणघातक असते.")
        riverside.append("आपत्कालीन संपर्क नंबर जवळ ठेवा.")
    elif is_rain and p < 1005:
        riverside.append("पुढील काही तासांत नदीची पातळी वाढू शकते. स्थानिक पूर इशाऱ्यांवर लक्ष ठेवा.")
        riverside.append("पूर्वी पूर आलेल्या ठिकाणी वाळूच्या पिशव्या तयार ठेवा.")
        riverside.append("पाऊस थांबेपर्यंत नदीकाठी फिरणे आणि मासेमारी टाळा.")
    elif is_rain:
        riverside.append("मध्यम पाऊस — नदीची पातळी थोडी वाढेल. आज पोहणे किंवा बोटिंग टाळा.")
        riverside.append("नदीकाठी राहत असल्यास पाण्याच्या पातळीवर लक्ष ठेवा.")
    else:
        riverside.append("आज नदीची परिस्थिती शांत आणि स्थिर दिसत आहे.")
        riverside.append("नदीकाठी उपक्रमांसाठी चांगल्या परिस्थिती आहेत — पण अचानक हवामान बदलाबद्दल सतर्क राहा.")
        riverside.append("नदीकाठ स्वच्छ ठेवा — सर्वांसाठी जबाबदारीने आनंद घ्या.")

    return {
        "farmers": farmers,
        "business": business,
        "residents": residents,
        "riverside": riverside,
        "heat_alert": heat_alert,
    }


@router.post("/")
def get_precautions(data: WeatherData):
    if data.lang == "mr":
        return rule_based_mr(data)
    return rule_based_en(data)
