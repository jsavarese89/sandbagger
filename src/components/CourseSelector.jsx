import { getFirestore, collection, getDocs, query, orderBy, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

const CourseSelector = ({ onCourseSelect }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    city: '',
    state: '',
    holes: 18,
    pars: Array(18).fill(4),
    handicaps: Array(18).fill(1),
  });

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const db = getFirestore();
        let coursesQuery = collection(db, 'courses');

        if (selectedState) {
          coursesQuery = query(coursesQuery, where('state', '==', selectedState));
        }

        coursesQuery = query(coursesQuery, orderBy('name'));

        const querySnapshot = await getDocs(coursesQuery);
        const coursesData = [];

        querySnapshot.forEach((doc) => {
          coursesData.push({ id: doc.id, ...doc.data() });
        });

        setCourses(coursesData);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [selectedState]);

  const handleCourseSelect = useCallback((course) => {
    onCourseSelect(course);
  }, [onCourseSelect]);

  const handleAddCourse = async () => {
    try {
      const db = getFirestore();
      const courseRef = doc(collection(db, 'courses'));

      await setDoc(courseRef, {
        ...newCourse,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Reset form and fetch updated courses
      setNewCourse({
        name: '',
        city: '',
        state: '',
        holes: 18,
        pars: Array(18).fill(4),
        handicaps: Array(18).fill(1),
      });

      setShowAddCourse(false);

      // Refresh the course list
      if (selectedState === newCourse.state || !selectedState) {
        setCourses([...courses, { id: courseRef.id, ...newCourse }]);
      }

    } catch (error) {
      console.error('Error adding course:', error);
    }
  };

  const handleParChange = useCallback((index, value) => {
    const newPars = [...newCourse.pars];
    newPars[index] = parseInt(value) || 3;
    setNewCourse(prev => ({ ...prev, pars: newPars }));
  }, [newCourse.pars]);

  const handleHandicapChange = useCallback((index, value) => {
    const newHandicaps = [...newCourse.handicaps];
    newHandicaps[index] = parseInt(value) || 1;
    setNewCourse(prev => ({ ...prev, handicaps: newHandicaps }));
  }, [newCourse.handicaps]);

  const filteredCourses = useMemo(() => {
    return courses.filter(course =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.city.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [courses, searchTerm]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Select Golf Course</h2>

      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          placeholder="Search by name or city..."
          className="flex-1 px-3 py-2 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="px-3 py-2 border rounded-lg"
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
        >
          <option value="">All States</option>
          {states.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-center py-4">Loading courses...</p>
      ) : (
        <>
          {filteredCourses.length > 0 ? (
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {filteredCourses.map(course => (
                <div
                  key={course.id}
                  className="p-3 border-b hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleCourseSelect(course)}
                >
                  <div className="font-semibold">{course.name}</div>
                  <div className="text-sm text-gray-600">{course.city}, {course.state}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4">No courses found. Try a different search or add a new course.</p>
          )}
        </>
      )}

      {!showAddCourse ? (
        <button
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          onClick={() => setShowAddCourse(true)}
        >
          Add New Course
        </button>
      ) : (
        <div className="mt-4 border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Add New Course</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Course Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={newCourse.name}
                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={newCourse.city}
                onChange={(e) => setNewCourse({ ...newCourse, city: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={newCourse.state}
                onChange={(e) => setNewCourse({ ...newCourse, state: e.target.value })}
              >
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Number of Holes</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={newCourse.holes}
                onChange={(e) => {
                  const holes = parseInt(e.target.value);
                  setNewCourse({
                    ...newCourse,
                    holes,
                    pars: Array(holes).fill(4),
                    handicaps: Array(holes).fill(1),
                  });
                }}
              >
                <option value={9}>9 Holes</option>
                <option value={18}>18 Holes</option>
              </select>
            </div>
          </div>

          <h4 className="text-md font-medium mt-4 mb-2">Hole Details</h4>

          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-2 py-1 text-left">Hole</th>
                  {Array.from({ length: Math.min(9, newCourse.holes) }).map((_, i) => (
                    <th key={`hole-${i + 1}`} className="border px-2 py-1 text-center w-10">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-1 font-medium">Par</td>
                  {Array.from({ length: Math.min(9, newCourse.holes) }).map((_, i) => (
                    <td key={`par-cell-${i}`} className="border px-2 py-1 text-center">
                      <select
                        key={`par-${i}`}
                        className="w-full px-1 text-center"
                        style={{ maxWidth: '50px' }}
                        value={newCourse.pars[i]}
                        onChange={(e) => handleParChange(i, e.target.value)}
                      >
                        {[3, 4, 5, 6].map(num => (
                          <option key={`par-${i}-${num}`} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border px-2 py-1 font-medium">HDCP</td>
                  {Array.from({ length: Math.min(9, newCourse.holes) }).map((_, i) => (
                    <td key={`hdcp-cell-${i}`} className="border px-2 py-1 text-center">
                      <select
                        key={`handicap-${i}`}
                        className="w-full px-1 text-center"
                        style={{ maxWidth: '50px' }}
                        value={newCourse.handicaps[i]}
                        onChange={(e) => handleHandicapChange(i, e.target.value)}
                      >
                        {Array.from({ length: 18 }, (_, index) => (
                          <option key={`hdcp-${i}-${index + 1}`} value={index + 1}>
                            {index + 1}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {newCourse.holes > 9 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-2 py-1 text-left">Hole</th>
                    {Array.from({ length: newCourse.holes - 9 }).map((_, i) => (
                      <th key={`hole-${i + 10}`} className="border px-2 py-1 text-center w-10">
                        {i + 10}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1 font-medium">Par</td>
                    {Array.from({ length: newCourse.holes - 9 }).map((_, i) => (
                      <td key={`par-cell-${i + 9}`} className="border px-2 py-1 text-center">
                        <select
                          key={`par-${i + 9}`}
                          className="w-full px-1 text-center"
                          style={{ maxWidth: '50px' }}
                          value={newCourse.pars[i + 9]}
                          onChange={(e) => handleParChange(i + 9, e.target.value)}
                        >
                          {[3, 4, 5, 6].map(num => (
                            <option key={`par-${i + 9}-${num}`} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border px-2 py-1 font-medium">HDCP</td>
                    {Array.from({ length: newCourse.holes - 9 }).map((_, i) => (
                      <td key={`hdcp-cell-${i + 9}`} className="border px-2 py-1 text-center">
                        <select
                          key={`handicap-${i + 9}`}
                          className="w-full px-1 text-center"
                          style={{ maxWidth: '50px' }}
                          value={newCourse.handicaps[i + 9]}
                          onChange={(e) => handleHandicapChange(i + 9, e.target.value)}
                        >
                          {Array.from({ length: 18 }, (_, index) => (
                            <option key={`hdcp-${i + 9}-${index + 1}`} value={index + 1}>
                              {index + 1}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <button
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              onClick={() => setShowAddCourse(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              onClick={handleAddCourse}
              disabled={!newCourse.name || !newCourse.city || !newCourse.state}
            >
              Save Course
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSelector;
