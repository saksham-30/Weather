import requests
try:
    r = requests.post('http://127.0.0.1:8000/forecast/predict', json={'lat':20.5937,'lon':78.9629}, timeout=15)
    print('status', r.status_code)
    print(r.text)
except Exception as e:
    print('ERR', e)
