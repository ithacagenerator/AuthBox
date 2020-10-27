var count = 1;
db.Members.find({}).forEach((m) => {
  if (Array.isArray(m.access_codes)) {
    var changes = false;
    m.access_codes.forEach((c) => {
      if (c.code.startsWith('0')) {
        print(count, m.name, c.code, `${+c.code}`);
        c.code = `${+c.code}`;
        changes = true;
      }
    });

    if (changes) { 
      db.Members.updateOne({_id: m._id}, {$set: {access_codes: m.access_codes}});
      count++;
    }
  }
});
