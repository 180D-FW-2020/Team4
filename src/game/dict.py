import random 

lines = open("WordList.txt").readlines() 
myword = list(map(str.strip, random.sample(lines, 3)))
print (myword)