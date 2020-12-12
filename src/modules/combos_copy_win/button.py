from selenium import webdriver
import time

options = webdriver.ChromeOptions()
options.add_argument('--ignore-certificate-errors')
options.add_argument("--test-type")
driver = webdriver.Chrome(executable_path='/Users/joanibajlozi/Desktop/chromedriver',options=options)
driver.get('localhost:5000')

while True:
    # click submit button
    submit_button = driver.find_elements_by_xpath('//*[@id="recordButton"]')[0]
    submit_button.click()

    time.sleep(5.0)

    submit_button = driver.find_elements_by_xpath('//*[@id="stopButton"]')[0]
    submit_button.click()

    time.sleep(10.0)